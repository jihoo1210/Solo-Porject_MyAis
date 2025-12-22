package com.myais.infra.s3;

import com.myais.global.exception.CustomException;
import com.myais.global.exception.ErrorCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.io.IOException;
import java.time.Duration;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
public class S3Service {

    @Value("${aws.access-key}")
    private String accessKey;

    @Value("${aws.secret-key}")
    private String secretKey;

    @Value("${aws.s3.bucket}")
    private String bucket;

    @Value("${aws.s3.region}")
    private String region;

    private S3Client s3Client;
    private S3Presigner s3Presigner;

    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
            "image/jpeg", "image/png", "image/gif", "image/webp"
    );
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    @PostConstruct
    public void init() {
        AwsBasicCredentials credentials = AwsBasicCredentials.create(accessKey, secretKey);
        StaticCredentialsProvider credentialsProvider = StaticCredentialsProvider.create(credentials);
        Region awsRegion = Region.of(region);

        this.s3Client = S3Client.builder()
                .region(awsRegion)
                .credentialsProvider(credentialsProvider)
                .build();

        this.s3Presigner = S3Presigner.builder()
                .region(awsRegion)
                .credentialsProvider(credentialsProvider)
                .build();
    }

    @PreDestroy
    public void destroy() {
        if (s3Presigner != null) {
            s3Presigner.close();
        }
    }

    public String uploadImage(MultipartFile file) {
        validateImageFile(file);

        String originalFilename = file.getOriginalFilename();
        String extension = originalFilename != null && originalFilename.contains(".")
                ? originalFilename.substring(originalFilename.lastIndexOf("."))
                : ".jpg";
        String key = "images/" + UUID.randomUUID() + extension;

        try {
            PutObjectRequest request = PutObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .contentType(file.getContentType())
                    .build();

            s3Client.putObject(request, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

            // Presigned URL 생성 (7일 유효)
            return generatePresignedUrl(key);
        } catch (IOException e) {
            log.error("Failed to upload file to S3", e);
            throw new CustomException(ErrorCode.FILE_UPLOAD_FAILED);
        }
    }

    public void deleteFile(String fileUrl) {
        try {
            String key = extractKeyFromUrl(fileUrl);

            DeleteObjectRequest request = DeleteObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .build();

            s3Client.deleteObject(request);
        } catch (Exception e) {
            log.error("Failed to delete file from S3", e);
        }
    }

    /**
     * Base64 인코딩된 이미지를 S3에 업로드
     * AI 이미지 생성 결과를 저장하는 데 사용
     */
    public String uploadBase64Image(String base64Data, String mimeType) {
        try {
            // MIME 타입에서 확장자 추출
            String extension = ".png";
            if (mimeType != null) {
                if (mimeType.contains("jpeg") || mimeType.contains("jpg")) {
                    extension = ".jpg";
                } else if (mimeType.contains("gif")) {
                    extension = ".gif";
                } else if (mimeType.contains("webp")) {
                    extension = ".webp";
                }
            }

            String key = "ai-generated/" + UUID.randomUUID() + extension;

            // Base64 디코딩
            byte[] imageBytes = java.util.Base64.getDecoder().decode(base64Data);

            PutObjectRequest request = PutObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .contentType(mimeType != null ? mimeType : "image/png")
                    .build();

            s3Client.putObject(request, RequestBody.fromBytes(imageBytes));

            log.info("AI generated image uploaded to S3: {}", key);

            // Presigned URL 생성 (7일 유효)
            return generatePresignedUrl(key);
        } catch (Exception e) {
            log.error("Failed to upload base64 image to S3", e);
            throw new CustomException(ErrorCode.FILE_UPLOAD_FAILED, "AI 생성 이미지 저장 실패");
        }
    }

    private void validateImageFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new CustomException(ErrorCode.INVALID_FILE_TYPE, "파일이 비어있습니다.");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new CustomException(ErrorCode.FILE_SIZE_EXCEEDED);
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType)) {
            throw new CustomException(ErrorCode.INVALID_FILE_TYPE);
        }
    }

    /**
     * Presigned URL 생성 (7일 유효)
     */
    public String generatePresignedUrl(String key) {
        GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .build();

        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(Duration.ofDays(7))
                .getObjectRequest(getObjectRequest)
                .build();

        PresignedGetObjectRequest presignedRequest = s3Presigner.presignGetObject(presignRequest);
        return presignedRequest.url().toString();
    }

    /**
     * URL에서 key 추출 후 새 Presigned URL 생성
     */
    public String refreshPresignedUrl(String url) {
        String key = extractKeyFromUrl(url);
        return generatePresignedUrl(key);
    }

    private String extractKeyFromUrl(String url) {
        // Presigned URL 또는 일반 S3 URL에서 key 추출
        String baseUrl = String.format("https://%s.s3.%s.amazonaws.com/", bucket, region);
        if (url.contains("?")) {
            // Presigned URL인 경우 쿼리 파라미터 제거
            url = url.substring(0, url.indexOf("?"));
        }
        return url.replace(baseUrl, "");
    }
}

package com.myais.global.exception;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
@AllArgsConstructor
public enum ErrorCode {

    // Common
    INVALID_INPUT_VALUE(HttpStatus.BAD_REQUEST, "C001", "잘못된 입력값입니다."),
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "C002", "서버 오류가 발생했습니다."),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "C003", "인증이 필요합니다."),
    ACCESS_DENIED(HttpStatus.FORBIDDEN, "C004", "접근 권한이 없습니다."),

    // Auth
    EMAIL_ALREADY_EXISTS(HttpStatus.CONFLICT, "A001", "이미 사용 중인 이메일입니다."),
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "A002", "사용자를 찾을 수 없습니다."),
    INVALID_PASSWORD(HttpStatus.UNAUTHORIZED, "A003", "비밀번호가 일치하지 않습니다."),
    INVALID_TOKEN(HttpStatus.UNAUTHORIZED, "A004", "유효하지 않은 토큰입니다."),
    EXPIRED_TOKEN(HttpStatus.UNAUTHORIZED, "A005", "만료된 토큰입니다."),

    // AI Tool
    AI_TOOL_NOT_FOUND(HttpStatus.NOT_FOUND, "T001", "AI 도구를 찾을 수 없습니다."),
    AI_TOOL_LIMIT_EXCEEDED(HttpStatus.FORBIDDEN, "T002", "AI 도구 생성 한도를 초과했습니다."),
    EXECUTION_LIMIT_EXCEEDED(HttpStatus.FORBIDDEN, "T003", "일일 실행 한도를 초과했습니다."),

    // Execution
    EXECUTION_NOT_FOUND(HttpStatus.NOT_FOUND, "E001", "실행 기록을 찾을 수 없습니다."),
    EXECUTION_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "E002", "AI 실행 중 오류가 발생했습니다."),

    // Payment
    PAYMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "P001", "결제 정보를 찾을 수 없습니다."),
    PAYMENT_FAILED(HttpStatus.BAD_REQUEST, "P002", "결제 처리에 실패했습니다."),
    INVALID_WEBHOOK_SIGNATURE(HttpStatus.BAD_REQUEST, "P003", "웹훅 서명이 유효하지 않습니다."),
    SUBSCRIPTION_NOT_FOUND(HttpStatus.NOT_FOUND, "P004", "구독 정보를 찾을 수 없습니다."),

    // File
    FILE_UPLOAD_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "F001", "파일 업로드에 실패했습니다."),
    INVALID_FILE_TYPE(HttpStatus.BAD_REQUEST, "F002", "지원하지 않는 파일 형식입니다."),
    FILE_SIZE_EXCEEDED(HttpStatus.BAD_REQUEST, "F003", "파일 크기가 제한을 초과했습니다."),

    // Crawl
    CRAWL_FAILED(HttpStatus.BAD_REQUEST, "R001", "URL 크롤링에 실패했습니다."),
    INVALID_URL(HttpStatus.BAD_REQUEST, "R002", "유효하지 않은 URL입니다.");

    private final HttpStatus status;
    private final String code;
    private final String message;
}

package com.myais.infra.crawler;

import com.myais.global.exception.CustomException;
import com.myais.global.exception.ErrorCode;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;

@Slf4j
@Service
public class CrawlerService {

    private static final int TIMEOUT_MS = 10000;
    private static final int MAX_CONTENT_LENGTH = 10000;

    public String crawl(String urlString) {
        validateUrl(urlString);

        try {
            Document doc = Jsoup.connect(urlString)
                    .timeout(TIMEOUT_MS)
                    .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
                    .get();

            return extractContent(doc);
        } catch (IOException e) {
            log.error("Failed to crawl URL: {}", urlString, e);
            throw new CustomException(ErrorCode.CRAWL_FAILED, "URL을 크롤링할 수 없습니다: " + e.getMessage());
        }
    }

    private void validateUrl(String urlString) {
        try {
            URL url = new URL(urlString);
            String protocol = url.getProtocol();
            if (!protocol.equals("http") && !protocol.equals("https")) {
                throw new CustomException(ErrorCode.INVALID_URL, "HTTP 또는 HTTPS URL만 지원합니다.");
            }
        } catch (MalformedURLException e) {
            throw new CustomException(ErrorCode.INVALID_URL);
        }
    }

    private String extractContent(Document doc) {
        StringBuilder content = new StringBuilder();

        // Title
        String title = doc.title();
        if (!title.isEmpty()) {
            content.append("# ").append(title).append("\n\n");
        }

        // Meta description
        Element metaDesc = doc.selectFirst("meta[name=description]");
        if (metaDesc != null) {
            String description = metaDesc.attr("content");
            if (!description.isEmpty()) {
                content.append(description).append("\n\n");
            }
        }

        // Main content - try common article selectors
        Element mainContent = doc.selectFirst("article, main, .content, .post, .article, #content, #main");

        if (mainContent != null) {
            content.append(extractText(mainContent));
        } else {
            // Fallback to body content
            Element body = doc.body();
            if (body != null) {
                // Remove unwanted elements
                body.select("script, style, nav, header, footer, aside, .sidebar, .navigation, .menu, .ad, .advertisement").remove();
                content.append(extractText(body));
            }
        }

        String result = content.toString().trim();

        // Truncate if too long
        if (result.length() > MAX_CONTENT_LENGTH) {
            result = result.substring(0, MAX_CONTENT_LENGTH) + "\n\n[내용이 너무 길어 잘렸습니다...]";
        }

        return result;
    }

    private String extractText(Element element) {
        StringBuilder text = new StringBuilder();

        Elements headings = element.select("h1, h2, h3, h4, h5, h6");
        Elements paragraphs = element.select("p");
        Elements lists = element.select("ul, ol");

        for (Element heading : headings) {
            String level = heading.tagName();
            int headingLevel = Integer.parseInt(level.substring(1));
            text.append("#".repeat(headingLevel)).append(" ").append(heading.text()).append("\n\n");
        }

        for (Element p : paragraphs) {
            String pText = p.text().trim();
            if (!pText.isEmpty()) {
                text.append(pText).append("\n\n");
            }
        }

        for (Element list : lists) {
            Elements items = list.select("li");
            for (Element item : items) {
                text.append("- ").append(item.text()).append("\n");
            }
            text.append("\n");
        }

        return text.toString();
    }
}

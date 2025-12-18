package com.myais.global.scheduler;

import com.myais.domain.user.entity.User;
import com.myais.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class SubscriptionScheduler {

    private final UserRepository userRepository;

    /**
     * 매일 자정에 FREE 사용자의 일일 사용량 초기화
     * 크론 표현식: 초 분 시 일 월 요일
     */
    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void resetDailyUsage() {
        log.info("Starting daily usage reset at {}", LocalDateTime.now());

        List<User> freeUsers = userRepository.findBySubscription("FREE");
        int resetCount = 0;

        for (User user : freeUsers) {
            user.resetDailyUsage();
            resetCount++;
        }

        userRepository.saveAll(freeUsers);
        log.info("Daily usage reset completed. Reset {} FREE users", resetCount);
    }

    /**
     * 매일 자정에 만료된 PRO 구독 처리
     * PRO -> FREE 전환
     */
    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void expireSubscriptions() {
        log.info("Starting subscription expiration check at {}", LocalDateTime.now());

        List<User> proUsers = userRepository.findBySubscription("PRO");
        int expiredCount = 0;

        for (User user : proUsers) {
            if (user.isSubscriptionExpired()) {
                user.expireSubscription();
                expiredCount++;
                log.info("Expired subscription for user: {}", user.getEmail());
            }
        }

        if (expiredCount > 0) {
            userRepository.saveAll(proUsers);
        }

        log.info("Subscription expiration check completed. Expired {} subscriptions", expiredCount);
    }

    /**
     * 구독 만료 3일 전 사용자 조회 (알림 발송용 - 추후 구현)
     * 매일 오전 9시에 실행
     */
    @Scheduled(cron = "0 0 9 * * *")
    public void checkExpiringSubscriptions() {
        log.info("Checking expiring subscriptions at {}", LocalDateTime.now());

        LocalDateTime threeDaysFromNow = LocalDateTime.now().plusDays(3);
        List<User> proUsers = userRepository.findBySubscription("PRO");

        for (User user : proUsers) {
            if (user.getSubscriptionExpiresAt() != null
                && user.getSubscriptionExpiresAt().isBefore(threeDaysFromNow)
                && user.getSubscriptionExpiresAt().isAfter(LocalDateTime.now())) {
                // TODO: 이메일 알림 발송
                log.info("Subscription expiring soon for user: {}, expires at: {}",
                    user.getEmail(), user.getSubscriptionExpiresAt());
            }
        }
    }
}

# Shared Recommendation Results

Status: Implemented
Version: v1
Last Updated: 2026-11-19

## Purpose

공유받은 사용자가 공유자의 결과를 먼저 확인한 뒤 자신의 익명 테스트를 시작할 수 있도록 공개 결과 URL을 제공한다. 공유 실패는 원래 결과 화면의 이용 가능성에 영향을 주지 않는다.

## Flow

```text
Owner result
  → POST /shared-results with complete answers
  → Backend recalculates the authoritative recommendation
  → Store immutable result snapshot
  → /results/{shareId}
  → Recipient views shared result
  → Recipient starts /test
```

브라우저가 보유한 추천 점수나 URL 데이터를 권위 있는 결과로 신뢰하지 않는다. 공유 생성 시 완전한 Assessment 답변을 Backend에 전달하고 기존 Recommendation Domain 흐름으로 결과를 다시 계산한다. 답변 원본은 저장하지 않는다.

## Persistence

`shared_results`는 다음 정보만 저장한다.

- 128-bit 무작위 URL-safe `id`
- schema version
- 검증된 `RecommendationResponse` JSON snapshot
- 생성 시각
- 만료 시각

공개 결과는 생성 후 30일 동안 조회할 수 있다. 만료 결과는 API에서 반환하지 않으며, 만료 행은 후속 공유 생성 시 opportunistic cleanup 대상으로 삭제한다. 엄격한 물리 삭제 SLA가 필요해지면 별도의 scheduled cleanup job을 추가한다.

운영 DB의 Lambda runtime role은 `shared_results`에 한해 `SELECT`, `INSERT`, `DELETE` 권한을 가진다. `INSERT`는 immutable snapshot 생성, `SELECT`는 공유 결과 조회, `DELETE`는 위 만료 행 정리에 필요하다. `UPDATE`, `TRUNCATE`, `REFERENCES`, `TRIGGER`는 필요하지 않다. Migration role이 테이블을 생성해도 별도 runtime role에 권한이 자동 부여되지 않으므로 배포 절차에서 effective grants를 검증한다.

## HTTP Contract

- `POST /shared-results`: `{ answers }`를 검증·재계산하고 `201 { shareId, expiresAt }` 반환
- `GET /shared-results/:id`: 유효하고 만료되지 않은 snapshot 반환; 없거나 만료되면 `404`

Web은 동일 출처 `/api/shared-results` Route Handler를 사용하며 Web→API 요청은 기존 HMAC 경계를 유지한다.

## Product and security properties

- 회원가입이나 사용자 식별자를 요구하지 않는다.
- Assessment 답변 원본을 저장하지 않는다.
- 공유 ID는 열거하기 어려운 128-bit 임의 값이다.
- 저장 snapshot은 runtime contract validation을 통과해야 한다.
- 공유 생성 또는 조회 실패가 소유자의 session 결과를 삭제하지 않는다.
- 공개 결과 페이지는 읽기 전용이며 `/test` CTA를 제공한다.


# Cocktail Dataset Profiles — Draft v1

Status: Draft  
Phase: 3 / P3-05-02  
Date: 2026-10-16

## 1. Purpose

실제 추천 서비스에 사용할 12개 칵테일의 맛 프로필을 검토하고 승인한다.

Golden Test의 가상 데이터는 운영 데이터의 점수 근거로 사용하지 않는다.

## 2. Scoring Policy

모든 핵심 차원은 1~5점으로 평가한다.

- sweet: 단맛의 체감 강도
- sour: 산미의 체감 강도
- bitter: 쓴맛의 체감 강도
- alcoholIntensity: 알코올의 체감 강도, ABV와 구분
- refreshing: 청량감 및 산뜻함

점수 1은 매우 낮음, 3은 중간, 5는 매우 높음을 의미한다.

Flavor는 존재 여부만 표현하며, BaseSpirit는 실제 베이스 증류주를 기준으로 한다. 허용된 표준 어휘만 사용한다.

## 3. Recipe Source Policy

- 표준 칵테일은 IBA 레시피를 우선 참고한다.
- 표준 레시피와 다른 변형은 별도 레시피를 명시한다.
- 각 프로필은 레시피 출처, 핵심 재료, 점수 근거를 기록한다.
- 가니시만으로 Flavor를 확정하지 않는다.
- 이미지 URL은 사용 권한을 확인하기 전까지 null로 둔다.

## 4. Review Checklist

각 칵테일마다 다음 항목을 검토한다.

- [ ] 레시피 출처 및 버전 확인
- [ ] 고유 ID와 표시 이름 확정
- [ ] 다섯 가지 맛 점수 검토
- [ ] Flavor 및 BaseSpirit 검토
- [ ] 비슷한 칵테일과의 상대적 점수 비교
- [ ] 점수의 근거 및 불확실성 기록
- [ ] 최종 승인

## 5. Activation Policy

프로필 승인 전 모든 Seed 데이터는 isActive: false로 유지한다.

프로필 검토와 DB 활성화는 별도 단계로 진행한다.

## 6. Acceptance Criteria

- 12개 칵테일 모두 레시피 출처와 프로필 근거를 갖는다.
- 모든 값이 Domain의 표준 어휘 및 범위를 만족한다.
- 점수 간 일관성과 차별성이 검토된다.
- 승인되지 않은 프로필은 운영 추천 후보로 노출되지 않는다.

## 7. Recipe-Based Profile Review — Batch 1

Status: Under Review

### Mojito

- Source: https://iba-world.com/iba-cocktail/mojito/
- Ingredients: White Cuban rum, lime juice, mint, sugar, soda water
- Proposed scores: sweet 3, sour 4, bitter 1, alcoholIntensity 2, refreshing 5
- Flavor: citrus, herbal
- BaseSpirit: rum
- Rationale: 라임의 산미와 민트의 허브 향, 소다의 청량감이 특징이다. 설탕이 들어가므로 단맛은 중간으로 평가한다.
- Review status: Provisional

### Margarita

- Source: https://iba-world.com/iba-cocktail/margarita/
- Ingredients: Tequila, triple sec, lime juice
- Proposed scores: sweet 2, sour 5, bitter 1, alcoholIntensity 4, refreshing 4
- Flavor: citrus
- BaseSpirit: tequila
- Rationale: 라임 중심의 산미가 강하며, 증류주와 오렌지 리큐어가 알코올감을 형성한다. 트리플 섹의 단맛을 고려해 sweet 2를 임시 부여한다.
- Review status: Provisional

### Negroni

- Source: https://iba-world.com/iba-cocktail/negroni/
- Ingredients: Gin, Campari, sweet red vermouth
- Proposed scores: sweet 3, sour 1, bitter 5, alcoholIntensity 4, refreshing 2
- Flavor: citrus, herbal
- BaseSpirit: gin
- Rationale: 캄파리의 강한 쓴맛과 스위트 베르무트의 단맛이 함께 존재한다. 과즙을 사용하지 않으므로 산미는 낮게 평가한다.
- Review status: Provisional

### Dry Martini

- Source: https://iba-world.com/iba-cocktail/dry-martini/
- Ingredients: Gin, dry vermouth
- Proposed scores: sweet 1, sour 1, bitter 2, alcoholIntensity 5, refreshing 1
- Flavor: herbal
- BaseSpirit: gin
- Rationale: 단맛이 낮고 증류주 비중이 높다. 진과 베르무트의 보태니컬 특성을 herbal로 분류한다.
- Review status: Provisional

### Americano

- Source: https://iba-world.com/iba-cocktail/americano/
- Ingredients: Campari, sweet red vermouth, soda water
- Proposed scores: sweet 3, sour 1, bitter 4, alcoholIntensity 2, refreshing 4
- Flavor: citrus, herbal (review required)
- BaseSpirit: []
- Rationale: 캄파리의 쓴맛과 베르무트의 단맛, 소다의 청량감이 특징이다. 현재 표준 BaseSpirit 목록에 해당하는 베이스 증류주가 없다.
- Review status: Provisional
- Open question: citrus가 실제 음료의 주된 맛인지, 오렌지 가니시만을 반영한 것인지 재검토한다.

## 8. Remaining Review

- [ ] Tom Collins
- [ ] Mezcal Margarita
- [ ] Piña Colada
- [ ] Tequila Sunrise
- [ ] Espresso Martini
- [ ] Old Fashioned
- [ ] Manhattan

모든 프로필은 승인 전까지 Draft 상태를 유지한다. 이 문서의 점수는 레시피 기반 추정이며 공식 IBA 평가 점수가 아니다.

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

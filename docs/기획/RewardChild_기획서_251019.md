# 🧩 RewardChild 개발 일지  
*(a.k.a. 우리아이 보상체계로 키우기)*  
**작성일:** 2025-10-19  
**작성자:** Kim Yohan  

---

## 1️⃣ 프로젝트 개요
**RewardChild**는 부모와 자녀 간의 “보상형 성장 시스템” 서비스다.  
부모가 아이에게 퀘스트(과제)를 등록하고, 완료 시 보상을 지급하며,  
아이(자녀)는 코인을 통해 상점에서 보상을 구매할 수 있다.

**핵심 역할**
- **부모(Parent)**: 퀘스트 의뢰인 / 상점 운영자 / 은행 충전 담당  
- **자녀(Child)**: 퀘스트 수행자 / 상점 이용자  
- **재화(COIN)**: 퀘스트 보상 및 상점 구매에 사용되는 통화 단위  

---

## 2️⃣ 초기 기획 구조

| 항목 | 내용 |
|------|------|
| 로그인 방식 | Supabase Auth + Kakao OAuth |
| 사용자 역할 | PARENT / CHILD |
| 상점(Shop) | 부모가 자녀용 보상 상품 등록 |
| 은행(Bank) | 부모가 현금으로 코인을 충전 (관리자만 수정 가능) |
| 퀘스트(Quest) | 부모가 의뢰하고, 자녀가 완료하면 코인 지급 |
| 거래(Transaction) | 모든 재화의 흐름 기록 |
| 관계(Relation) | 부모-자녀 연결(1:N 구조) |

---

## 3️⃣ ERD (최종 구조 기준)

| 테이블 | 주요 컬럼 | FK 및 설명 |
|--------|-----------|------------|
| **users** | id, nickname, tag, role, auth_user_id | RewardChild의 모든 사용자. Supabase Auth와 연결 |
| **relations** | parent_id, child_id, status | users.id ↔ users.id (부모/자녀 관계) |
| **quests** | parent_id, child_id, relation_id, reward, status | 부모가 의뢰, 자녀가 수행 |
| **shop_items** | parent_id, title, price | 부모가 등록한 상점 상품 |
| **shop_purchases** | child_id, shop_item_id, price_paid | 자녀가 상점 구매 |
| **bank_items** | title, price | 코인 구매용 상품 (관리자만 수정 가능) |
| **bank_purchases** | parent_id, bank_item_id, amount, coins_granted | 부모가 충전한 내역 |
| **balances** | user_id, balance | 각 사용자의 코인 잔액 |
| **transactions** | user_id, type, amount, reference_type, reference_id | 재화 흐름 로그 |

---

## 4️⃣ FK(외래키) 연결

```sql
ALTER TABLE relations      ADD CONSTRAINT fk_relations_parent      FOREIGN KEY (parent_id)      REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE relations      ADD CONSTRAINT fk_relations_child       FOREIGN KEY (child_id)       REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE shop_purchases ADD CONSTRAINT fk_shop_purchases_child  FOREIGN KEY (child_id)       REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE bank_purchases ADD CONSTRAINT fk_bank_purchases_parent FOREIGN KEY (parent_id)      REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE balances       ADD CONSTRAINT fk_balances_user         FOREIGN KEY (user_id)        REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE transactions   ADD CONSTRAINT fk_transactions_user     FOREIGN KEY (user_id)        REFERENCES users(id) ON DELETE CASCADE;
```

### ✅ 관계도 요약
```
users
├── relations (parent_id → users.id)
│             (child_id  → users.id)
│
├── shop_purchases (child_id → users.id)
├── bank_purchases (parent_id → users.id)
├── balances (user_id → users.id)
└── transactions (user_id → users.id)
```

---

## 5️⃣ Row Level Security (RLS) 정책

### ✅ users 테이블
자신 + 연결된 가족 구성원(부모/자녀) 조회 허용

```sql
DROP POLICY IF EXISTS "Users can view only their own data" ON users;

CREATE POLICY "View self or related family members"
ON users
FOR SELECT
USING (
  auth.uid() = auth_user_id
  OR EXISTS (
    SELECT 1 FROM relations r
    WHERE r.parent_id = users.id
      AND r.child_id IN (SELECT u2.id FROM users u2 WHERE u2.auth_user_id = auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM relations r
    WHERE r.child_id = users.id
      AND r.parent_id IN (SELECT u2.id FROM users u2 WHERE u2.auth_user_id = auth.uid())
  )
);
```

### ✅ relations 테이블
auth_user_id 기반으로 부모/자녀 모두 접근 가능하게 수정

```sql
CREATE POLICY "Parents and children can view their relations"
ON relations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id IN (relations.parent_id, relations.child_id)
    AND u.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Parents can insert relations"
ON relations
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = relations.parent_id
    AND u.auth_user_id = auth.uid()
    AND u.role = 'PARENT'
  )
);
```

### ✅ shop_items / bank_items
```sql
CREATE POLICY "Everyone can view shop/bank items"
ON shop_items
FOR SELECT USING (TRUE);

CREATE POLICY "Only parents can manage shop items"
ON shop_items
FOR ALL
USING (EXISTS (SELECT 1 FROM users u WHERE u.auth_user_id = auth.uid() AND u.role = 'PARENT'))
WITH CHECK (EXISTS (SELECT 1 FROM users u WHERE u.auth_user_id = auth.uid() AND u.role = 'PARENT'));

CREATE POLICY "Only service_role can modify bank items"
ON bank_items
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');
```

---

## 6️⃣ Supabase Function (RPC)

### ✅ `find_child_by_tag`
자녀 닉네임 + 태그로 조회할 수 있는 함수 (RLS 우회용)

```sql
CREATE OR REPLACE FUNCTION public.find_child_by_tag(
  _nickname text,
  _tag text
)
RETURNS TABLE(id bigint, nickname text, tag text)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT u.id, u.nickname, u.tag
  FROM public.users u
  WHERE u.role = 'CHILD'::user_role
    AND u.nickname = _nickname
    AND u.tag = _tag
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.find_child_by_tag(text, text) TO anon, authenticated;
```

→ `supabase.rpc('find_child_by_tag', { _nickname, _tag })` 으로 호출 가능

---

## 7️⃣ Expo (App & Web) 구조

| 항목 | 설명 |
|------|------|
| **프로젝트명** | rewardChild |
| **로그인** | Kakao → Supabase Auth 연동 |
| **초기 진입 흐름** | nickname 설정 → 역할 선택 (PARENT / CHILD) |
| **연결 프로세스** | parent가 child의 “nickname#tag”로 연결 요청 |
| **자녀 화면** | 부모의 요청 대기 / 승인 |
| **Alert 문제** | 웹에서는 `Alert.alert()` 동작 안 함 → `showAlert()` 유틸 추가 |
| **세션 관리** | `supabase.auth.getSession()` 로 토큰 만료 감지 + `/login` 이동 |

---

### ✅ showAlert 유틸 (웹/앱 공용)
```ts
import { Platform, Alert } from 'react-native'

export const showAlert = (title: string, message?: string) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}${message ? `\n${message}` : ''}`)
  } else {
    Alert.alert(title, message)
  }
}
```

---

## 8️⃣ 주요 이슈 & 해결 내역

| 문제 | 원인 | 해결책 |
|------|------|--------|
| `"No API key found"` | 환경변수 미적용 | `.env`에 `EXPO_PUBLIC_` prefix 추가 |
| `PGRST116: result contains 0 rows` | RLS 혹은 인코딩 문제 | `.maybeSingle()` + RPC로 우회 |
| `"violates row-level security policy"` | auth.uid() vs users.id 타입 불일치 | auth_user_id 기반 정책으로 수정 |
| users join 시 null | RLS 차단 | “자기 자신 + 관계된 사용자” 정책으로 확장 |
| Alert.alert 웹 미표시 | React Native 전용 | `showAlert()` 유틸 추가 |
| Kakao 로그인 후 users 미생성 | 트리거 기본값 수정 (role='DEFAULT') | 트리거 함수 수정 완료 |

---

## 9️⃣ 현재 RewardChild 개발 상태 (2025.10 기준)

| 분야 | 상태 |
|------|------|
| 📋 기획 및 ERD | ✅ 완료 |
| 🧱 Supabase Schema | ✅ 구축 완료 (FK + ENUM + RLS) |
| ⚙️ Kakao Auth 연동 | ✅ 완료 |
| 👤 닉네임/역할 설정 | ✅ 완료 |
| 🔗 부모-자녀 연결 | ✅ RPC + 정책 통과 |
| 🔐 RLS (auth_user_id 기반) | ✅ 정상 동작 |
| 🖥️ Web/App Alert 분리 | ✅ 구현 완료 |
| 💬 다음 단계 | 퀘스트 등록/보상 지급/코인 트랜잭션 구현 |

---

## 10️⃣ 다음 단계 제안

1. 자녀 승인(연결 요청 수락) 기능  
2. 퀘스트 등록 / 완료 / 보상 지급 흐름  
3. 상점(shop_items) + 은행(bank_items) UI 연결  
4. balances + transactions 로 재화 흐름 시각화  
5. RLS 정책 완성본 통합 테스트  

---

## ✅ 요약
> RewardChild는 Supabase + Expo 기반의 부모-자녀 보상 관리 서비스다.  
> Kakao 로그인 → 닉네임/역할 설정 → 부모-자녀 관계 연결까지 구현 완료.  
> 현재는 **RLS 기반 데이터 보안 구조 + RPC 기반 조회 기능**이 완성된 상태이며,  
> 이후 단계로 퀘스트·코인 시스템이 추가될 예정이다. ✅

---

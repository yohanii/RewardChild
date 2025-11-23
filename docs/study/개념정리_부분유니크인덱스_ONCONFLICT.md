# [개념 정리] 부분 유니크 인덱스 & ON CONFILCT

## 유니크 인덱스

해당 컬럼이 테이블에서 1개임을 보장함.

해당 컬럼이 중복된 row를 insert하려고 하면 에러 남.

예시)

```sql
CREATE UNIQUE INDEX ux_email ON users (email);
```

해당 쿼리에서 users.email이 중복이면,

`duplicate key value violates unique constraint` 에러가 남.

---

## 부분 유니크 인덱스

중복 제약을 특정 조건에 대해서 걸때, 부분 유니크 인덱스라고 함.

예시)

```sql
CREATE UNIQUE INDEX ux_tx_initial_credit_once
ON transactions (user_id)
WHERE type = 'INITIAL_CREDIT';
```

해당 쿼리의 뜻은 `type = 'INITIAL_CREDIT'` 일 때만, user_id 중복이 없어야함.

---

## ON CONFLICT

내가 사용했던 `ON CONFLICT … DO NOTHING`은 충돌 나면 암것도 안하고 넘어가겠다.

예시)

```sql
INSERT INTO transactions (user_id, type, amount)
VALUES (1, 'INITIAL_CREDIT', 200)
ON CONFLICT (user_id) DO NOTHING;
```

해당 쿼리는 user_id에 대해 충돌이 일어나면,

INSERT 하지 않겠다.

---

## 원인 분석 Again

그래서, 해당 개념들을 통해 문제 일어났던 원인을 다시 분석해보자.

에러)

```sql
there is no unique or exclusion constraint matching the ON CONFLICT specification
```

문제의 쿼리)

```sql
INSERT INTO transactions (user_id, type, amount)
VALUES (1, 'INITIAL_CREDIT', 200)
ON CONFLICT (user_id) DO NOTHING;
```

동작

ON CONFLICT가 걸리면, 해당 쿼리에 대한 제약 또는 인덱스 위반 가능성을 확인한다.

그래서, 해당 쿼리에선 (user_id)를 유일하게 보장하는 인덱스가 있는지 확인함.

원인

(user_id)에 대한 유니크 인덱스가 걸려있으면 괜찮음.

하지만, 나는 부분 유니크 인덱스가 걸려있어서 문제였던 것.

GPT 왈)

`ON CONFLICT (user_id)`라고 했지만

해당 테이블엔 **그걸 만족하는 유니크 인덱스**가 없다고 보는 거야.

- 전체 유니크 인덱스가 없거나
- 부분 유니크인데, 현재 INSERT 데이터가 조건(predicate)을 만족하지 않거나
- 컬럼 리스트가 다른 경우

해결

### 동일한 predicate를 명시

Postgres 15부터는 `ON CONFLICT`에서도 부분 유니크 인덱스의 조건을 명시적으로 적을 수 있게 됨.

```sql
ON CONFLICT (user_id) WHERE (type='INITIAL_CREDIT') DO NOTHING;
```

이러면 Postgres에게 이렇게 말하는 것과 같아:

> “이 충돌 규칙은 (user_id) 컬럼이고,
> 
> 
> 단 **type='INITIAL_CREDIT'** 조건의 유니크 인덱스에 해당하는 거야.”
> 

그래서 Postgres는 정확히 그 **부분 인덱스**와 매칭시키고, 에러 없이 동작하게 돼요.
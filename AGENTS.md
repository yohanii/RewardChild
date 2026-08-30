# AGENTS.md

## 프로젝트

RewardChild는 Expo + React Native + TypeScript 기반의 부모·자녀 보상 관리 앱이며, 백엔드로 Supabase를 사용한다.

현재 MVP 개발 중이다. 기존 코드, `docs/`의 과거 기록, 원격 Supabase 상태가 완전히 일치하지 않을 수 있으므로 변경 전에 반드시 실제 구현을 확인한다.

## 기본 원칙

* 요청한 작업에 필요한 최소한의 변경만 한다.
* 관련 없는 대규모 리팩터링을 하지 않는다.
* 코드가 레거시처럼 보여도 실제 사용 여부를 확인하기 전에 삭제하지 않는다.
* 명시적인 요청이 없으면 git commit을 하지 않는다.
* secret, password, service role key 등 민감한 정보를 코드나 로그에 노출하지 않는다.

## Supabase

현재 원격 Supabase에는 Git으로 관리되지 않는 schema, RLS, RPC, function, trigger가 존재할 수 있다.

검증된 baseline migration이 만들어지기 전까지:

* 기존 DB 구조를 임의로 변경하거나 재설계하지 않는다.
* `docs/`의 SQL을 현재 DB의 source of truth로 간주하지 않는다.
* `supabase db push`를 실행하지 않는다.
* 명시적인 요청 없이 원격 DB를 변경하지 않는다.

Migration 체계 구축 이후 DB 구조 변경은 모두 `supabase/migrations/`에서 관리한다.

RLS 문제를 해결하기 위해 RLS를 비활성화하지 않는다. Frontend에서 `service_role` key를 사용하지 않는다.

## 재화

`ATTENDANCE`, `CASH`, balances, transactions의 정확한 규칙은 아직 검증 중이다.

재화 로직을 수정하기 전에 현재 schema, RPC, frontend 사용 방식을 먼저 조사한다. 재화 차감·지급과 관련된 여러 DB 변경은 가능한 한 하나의 transaction으로 처리한다.

## 코드 구조

가능하면 다음 흐름을 유지한다.

UI → hook/service → Supabase

화면 컴포넌트에 복잡한 비즈니스 로직을 직접 추가하지 않는다.

## 작업 절차

1. 관련 파일과 기존 구현을 확인한다.
2. 필요한 최소 변경만 구현한다.
3. 가능한 검사를 실행한다.
4. `git diff`로 변경 범위를 확인한다.
5. 변경 파일, 검사 결과, 남은 문제를 보고한다.

코드 변경 후 가능한 경우 다음을 실행한다.

```bash
npx tsc --noEmit
npm run lint
```

관련 테스트나 DB 검증 명령이 존재하면 함께 실행한다.

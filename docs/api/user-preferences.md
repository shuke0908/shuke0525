# 사용자 환경설정 API 문서

## 1. 환경설정 조회

사용자의 환경설정을 조회합니다.

### 요청

```http
GET /api/user/preferences
```

#### 인증
- Bearer 토큰 필요

### 응답

#### 성공 (200 OK)

```json
{
  "id": 1,
  "userId": "user-123",
  "theme": "system",
  "language": "ko",
  "emailNotifications": true,
  "pushNotifications": true,
  "createdAt": "2025-05-21T01:30:45.123Z",
  "updatedAt": "2025-05-21T01:30:45.123Z"
}
```

#### 환경설정이 없는 경우 (200 OK)

```json
{
  "theme": "system",
  "language": "en",
  "emailNotifications": true,
  "pushNotifications": true
}
```

## 2. 환경설정 업데이트

사용자의 환경설정을 업데이트합니다. 기존 설정이 없는 경우 새로 생성합니다.

### 요청

```http
PUT /api/user/preferences
Content-Type: application/json

{
  "theme": "dark",
  "language": "ko",
  "emailNotifications": false,
  "pushNotifications": true
}
```

#### 인증
- Bearer 토큰 필요

#### 요청 본문

| 필드 | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|--------|------|
| theme | string | 아니오 | 'system' | 테마 설정 (light/dark/system) |
| language | string | 아니오 | 'en' | 언어 코드 (예: ko, en) |
| emailNotifications | boolean | 아니오 | true | 이메일 알림 여부 |
| pushNotifications | boolean | 아니오 | true | 푸시 알림 여부 |

### 응답

#### 성공 (200 OK)

업데이트된 환경설정을 반환합니다.

```json
{
  "id": 1,
  "userId": "user-123",
  "theme": "dark",
  "language": "ko",
  "emailNotifications": false,
  "pushNotifications": true,
  "createdAt": "2025-05-21T01:30:45.123Z",
  "updatedAt": "2025-05-21T02:15:30.456Z"
}
```

#### 유효성 검사 실패 (400 Bad Request)

```json
{
  "error": "Validation Error",
  "details": [
    {
      "code": "invalid_enum_value",
      "expected": ["light", "dark", "system"],
      "received": "invalid-theme",
      "path": ["theme"],
      "message": "Invalid enum value. Expected 'light' | 'dark' | 'system', received 'invalid-theme'"
    }
  ]
}
```

## 3. 환경설정 필드 설명

### 테마 (theme)
- `light`: 밝은 테마
- `dark`: 어두운 테마
- `system`: 시스템 설정에 따름

### 언어 (language)
- `ko`: 한국어
- `en`: 영어
- 기타 ISO 639-1 언어 코드 지원

## 4. 에러 코드

| 코드 | 설명 |
|------|------|
| 401 | 인증 실패 (유효하지 않은 토큰) |
| 404 | 사용자를 찾을 수 없음 |
| 500 | 서버 내부 오류 |

## 5. 버전 히스토리

| 버전 | 날짜 | 설명 |
|------|------|------|
| 1.0.0 | 2025-05-21 | 최초 버전 |

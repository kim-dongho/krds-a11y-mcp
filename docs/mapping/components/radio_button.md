# radio_button × KWCAG 2.2 매핑

> 기준: 킷 v1.1.0(d6bb184) · KWCAG 2.2(KS X OT0003) · axe-core v4.13.0 · 여기 없는 항목은 전부 N/A. 공통 규칙·부록은 ../component-kwcag-map.md 참조

## krds:radio_button (라디오 버튼)

- 검토 파일: `html/code/radio_button.html`, `radio_chip.html`, `radio_size.html` (3파일 전수)
- 변형: 기본(부가 설명 포함), chip, size(medium/large)

### ① 자동 충족

| KWCAG       | 근거                                                                                               |
| ----------- | -------------------------------------------------------------------------------------------------- |
| kwcag:6.1.1 | 네이티브 `<input type="radio">` — 화살표 키 그룹 내 이동 브라우저 보장 (동일 `name` 전제 — ② 참조) |
| kwcag:6.5.3 | `<label for>`↔`<input id>` 연결                                                                    |
| kwcag:8.2.1 | 네이티브 시맨틱 — role·checked 상태 자동, ARIA 미사용                                              |
| kwcag:6.5.2 | 네이티브 컨트롤                                                                                    |

### ② 조건부 — 필수 입력

| KWCAG       | 필수 입력 필드     | 검증 규칙                                                                                                                           |
| ----------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| kwcag:7.3.2 | labelText, inputId | 비어있음 금지, for/id 일치                                                                                                          |
| kwcag:6.1.1 | radioGroupName     | 같은 선택지 그룹은 동일 `name` 필수 — 다르면 화살표 키 그룹 이동·단일 선택이 깨짐 (킷 데모의 `name="rdo_1a"`는 시연용 분리)         |
| kwcag:7.3.2 | groupLabel         | 라디오 그룹은 질문 자체의 레이블 필요 — `<fieldset><legend>` 또는 `role="radiogroup"+aria-label` (킷의 `.fieldset`은 class뿐인 div) |
| kwcag:8.1.1 | inputId            | 페이지 내 유일                                                                                                                      |

### ③ 범위 밖 — 위임

| KWCAG               | 위임처                                        |
| ------------------- | --------------------------------------------- |
| kwcag:5.4.1 (#chip) | 수동 체크 — chip 선택 상태의 비색상 단서 확인 |
| kwcag:5.4.3         | axe:color-contrast                            |
| kwcag:6.1.2         | 수동 체크 — 초점 표시                         |
| kwcag:6.1.3         | axe:target-size (옵트인)                      |
| kwcag:7.3.1         | 수동 체크 — 킷에 오류 상태 예시가 없음. 선택 누락 오류는 그룹(fieldset)에 `p.form-hint-invalid` 메시지를 두고 aria-describedby로 연결 (get_component 조립 지침, KRDS 입력폼 지침 global_08) |

### 미분류 (?)

| KWCAG | 질문                                                               |
| ----- | ------------------------------------------------------------------ |
| —     | 없음 (부가 설명 연결 문제는 checkbox의 ? 와 동일 — 정책 결정 공유) |

- 위에 없는 항목: 전부 N/A

---

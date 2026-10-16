# tts × KWCAG 2.2 매핑

> 기준: 킷 v1.1.0(d6bb184) · KWCAG 2.2(KS X OT0003) · axe-core v4.13.0 · 여기 없는 항목은 전부 N/A. 공통 규칙·부록은 ../component-kwcag-map.md 참조

## krds:tts (음성 안내)

- 기준: 킷 d6bb184 / `html/code/tts.html`(기본), `html/code/tts_icon.html`(`#icon`), `html/code/tts_size.html`(`#size`) / JS `ui-script.js:2403-2618` (krds_tts, window.krds_playTts)

### ① 자동 충족

| KWCAG                    | 근거                                                                                                                                                                        |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| kwcag:5.4.2              | 소리는 자동 재생되지 않음 — 사용자 클릭(user gesture)에서만 speak 호출(ui-script.js:2488 주석·:2421), 재생 중 같은 버튼 재클릭으로 정지(toggle :2432-2440) — 제어 수단 내장 |
| kwcag:8.2.1 (기본·#size) | 토글 버튼 패턴: `aria-pressed` 초기값 부여(:2418) 및 재생/정지 시 갱신(:2458, :2472) — button에 유효한 속성. 장식 아이콘 `aria-hidden="true"` 처리                          |
| kwcag:6.1.1              | 네이티브 `<button type="button">`, 비활성은 `disabled` 속성 — 보조기술·키보드에 상태 전달                                                                                   |
| kwcag:5.4.1              | 재생 상태를 색·아이콘만이 아니라 `aria-pressed` + 레이블 텍스트 전환("재생"↔"멈춤", updateText :2565-2579)으로 표시                                                         |
| kwcag:6.1.2              | 네이티브 초점 + 전역 `*:focus` outline (common.css:1053)                                                                                                                    |

### ② 조건부 — 필수 입력

| KWCAG                    | 필수 입력 필드       | 검증 규칙                                                                                                                                                                                                                                     |
| ------------------------ | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| kwcag:8.2.1 (#icon)      | accessibleName       | **아이콘 전용 변형은 접근 가능한 네임이 없다** — 유일한 콘텐츠가 `aria-hidden="true"` 아이콘(tts_icon.html) → axe:button-name·aria-toggle-field-name 실패. `aria-label`(또는 sr-only 텍스트) 필수, 비어있음 금지                              |
| kwcag:8.2.1 (기본·#size) | buttonLabel, ttsText | buttonLabel: `.krds-tts-text`의 "레이블" placeholder를 읽을 대상을 알 수 있는 텍스트로 교체. ttsText: 읽을 텍스트(onclick `krds_playTts('…', this)` 인자 또는 `data-tts-text`) — 비어있음 금지(빈 문자열이면 무동작, ui-script.js:2443·:2585) |

### ③ 범위 밖 — 위임

| KWCAG                      | 위임처                                           |
| -------------------------- | ------------------------------------------------ |
| kwcag:5.4.3                | axe:color-contrast                               |
| kwcag:6.1.3 (#size xsmall) | axe:target-size (옵트인) + 수동 — 최소 크기 변형 |

- 위에 없는 항목: 전부 N/A
- **주의 (매핑 아님)**: TTS 기능의 *존재*는 5.1.1(대체 텍스트)·5.2.1(멀티미디어 대체수단) 등 어떤 KWCAG 항목의 충족 근거도 아니다 — 킷 자체 설명이 "시각 정보의 대체가 아닌 보완 수단"으로 명시(tts.html 샘플 문안). 세부: tts_size.html의 small 버튼만 아이콘 span에 `aria-hidden` 누락 — 빈 `<i>` 요소라 실질 영향은 없으나 킷 내 비일관.

---

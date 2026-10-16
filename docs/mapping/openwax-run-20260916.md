# OpenWAX 교차검증 실행 로그 (2026-09-16)

> 요약·판정은 `pattern-audit.md`의 "OpenWAX 교차검증" 절 참조. 이 파일은 원본 출력 보존용.
> 엔진: goonoo/OpenWAX 커밋 085c44f — lib/Section.js + lib/Sections.js를 Playwright로 프리뷰에 주입.
> 자동 판정 13섹션 수집 (도구성 grayscale·contrast·validation 제외). 재교정(apply-form label) 반영 후 출력.
> 남은 fail 66건은 전부 데모 플레이스홀더 href="#"의 skipNav(제자리 앵커 연결 확인) 판정 — 비결함, 소비 시 실 URL로 교체되는 슬롯 몫.

```

✗ apply-complete
  skipNav 1/7 · pageTitle 1/1 · blockTitle 1/1 · linkText 8/8 · pageLang 1/1
  [skipNav][fail] <a href="#" class="txt" aria-current="page">신청 완료(데모)</a>
  [skipNav][fail] <a href="#" class="krds-btn xlarge tertiary">다시 신청하기</a>
  [skipNav][fail] <a href="#" class="krds-btn xlarge primary">신청 내역/결과보기</a>
  [skipNav][fail] <a href="#" class="krds-btn medium text">연관 서비스 1 <i class="svg-icon ico-angle right"></i></a>
  [skipNav][fail] <a href="#" class="krds-btn medium text">연관 서비스 2 <i class="svg-icon ico-angle right"></i></a>
  [skipNav][fail] <a href="#" class="krds-btn medium text">모든 서비스 목록 보기 <i class="svg-icon ico-angle right"></i></a>

✗ apply-detail
  skipNav 5/8 · pageTitle 1/1 · blockTitle 7/7 · linkText 9/9 · pageLang 1/1 · table 1/1
  [skipNav][fail] <a href="#" class="txt">서비스 신청</a>
  [skipNav][fail] <a href="#" class="txt" aria-current="page">서비스 상세 안내(데모)</a>
  [skipNav][fail] <a href="#" class="krds-btn small primary">온라인 신청하기</a>

✗ apply-form
  altTextBG 2/2 · skipNav 1/2 · pageTitle 1/1 · blockTitle 5/5 · linkText 3/3 · pageLang 1/1 · label 2/2
  [skipNav][fail] <a href="#" class="txt" aria-current="page">신청서 작성(데모)</a>

✗ apply-issue
  skipNav 1/3 · pageTitle 1/1 · blockTitle 7/7 · linkText 4/4 · pageLang 1/1 · label 6/6
  [skipNav][fail] <a href="#" class="txt" aria-current="page">증명서 발급 신청(데모)</a>
  [skipNav][fail] <a href="#" class="krds-btn xlarge tertiary">취소하기</a>

✗ apply-list
  altTextBG 6/6 · skipNav 1/10 · pageTitle 1/1 · blockTitle 1/1 · linkText 11/11 · pageLang 1/1 · label 5/5
  [skipNav][fail] <a href="#" class="txt" aria-current="page">신청 서비스 목록(데모)</a>
  [skipNav][fail] <a href="#" class="c-text">
            <p class="c-tit"><span class="span">서비스명 예시 1</span></p>
            <p class="c-txt">서비스에 대한 요약 설명이 들어간다.</p>
         
  [skipNav][fail] <a href="#" class="krds-btn medium secondary" title="서비스명 예시 1">신청하기</a>
  [skipNav][fail] <a href="#" class="c-text">
            <p class="c-tit"><span class="span">서비스명 예시 2</span></p>
            <p class="c-txt">서비스에 대한 요약 설명이 들어간다.</p>
         
  [skipNav][fail] <a href="#" class="krds-btn medium secondary" title="서비스명 예시 2">신청하기</a>
  [skipNav][fail] <a class="page-link active" href="#" aria-current="page">1</a>
  [skipNav][fail] <a class="page-link" href="#">2</a>
  [skipNav][fail] <a class="page-link" href="#">3</a>
  [skipNav][fail] <a class="page-navi next" href="#">다음</a>

✗ login-id
  skipNav 1/6 · pageTitle 1/1 · blockTitle 1/1 · linkText 7/7 · pageLang 1/1 · label 3/3
  [skipNav][fail] <a href="#" class="txt" aria-current="page">로그인</a>
  [skipNav][fail] <a href="#" class="krds-btn medium text">아이디 찾기</a>
  [skipNav][fail] <a href="#" class="krds-btn medium text">비밀번호 찾기</a>
  [skipNav][fail] <a href="#" class="krds-btn medium text">회원가입</a>
  [skipNav][fail] <a href="#" class="krds-btn medium link"><span class="underline">로그인 도움말 보기</span></a>

✗ login-select
  skipNav 1/10 · pageTitle 1/1 · blockTitle 10/10 · linkText 11/11 · pageLang 1/1
  [skipNav][fail] <a href="#" class="txt" aria-current="page">로그인 (인증 방식 선택)(데모)</a>
  [skipNav][fail] <a href="#" class="login-link">
                  <h3 class="type-tit">모바일 신분증</h3>
                  <p class="type-desc">행정안전부에서 제공하는 모바일 신분증 앱을 이용하여 로그인하기</p
  [skipNav][fail] <a href="#" class="login-link">
                  <h3 class="type-tit">공동·금융 인증서</h3>
                  <p class="type-desc">금융기관이나 공식인증기관에서 발급받은 공동인증서 또는 금융인증서
  [skipNav][fail] <a href="#" class="login-link">
                  <h3 class="type-tit">간편 인증</h3>
                  <p class="type-desc">민간 전자서명 사업자가 제공하는 전자서명을 이용하여 로그인하기</p>

  [skipNav][fail] <a href="#" class="login-link">
                  <h3 class="type-tit">소셜(SNS)계정으로 로그인</h3>
                  <p class="type-desc">자주 사용하는 소셜·포털사이트 계정으로 로그인하기</
  [skipNav][fail] <a href="#" class="login-link">
                  <h3 class="type-tit">아이디/비밀번호</h3>
                  <p class="type-desc">회원가입시 등록한 아이디와 비밀번호를 이용하여 로그인하기</p>

  [skipNav][fail] <a href="#" class="login-link">
                  <h3 class="type-tit">비회원 로그인</h3>
                  <p class="type-desc">회원가입 없이 간단한 본인확인만으로 서비스 이용하기</p>
    
  [skipNav][fail] <a href="#" class="krds-btn medium text">회원가입 <i class="svg-icon ico-angle right"></i></a>
  [skipNav][fail] <a href="#" class="krds-btn medium link"><span class="underline">로그인 도움말 보기</span></a>

✗ login-tabs
  skipNav 1/6 · pageTitle 1/1 · blockTitle 3/3 · linkText 7/7 · pageLang 1/1 · label 5/5
  [skipNav][fail] <a href="#" class="txt" aria-current="page">로그인 방식을 선택해주세요</a>
  [skipNav][fail] <a href="#" class="krds-btn medium text">아이디 찾기</a>
  [skipNav][fail] <a href="#" class="krds-btn medium text">비밀번호 찾기</a>
  [skipNav][fail] <a href="#" class="krds-btn medium text">회원가입</a>
  [skipNav][fail] <a href="#" class="krds-btn large tertiary">간편 인증으로 로그인하기</a>

✗ main-portal
  skipNav 1/15 · pageTitle 1/1 · blockTitle 3/3 · linkText 15/15 · pageLang 1/1 · label 1/1
  [skipNav][fail] <a href="#" class="krds-btn-tag link">추천 검색어 1</a>
  [skipNav][fail] <a href="#" class="krds-btn-tag link">추천 검색어 2</a>
  [skipNav][fail] <a href="#" class="krds-btn-tag link">추천 검색어 3</a>
  [skipNav][fail] <a href="#" class="krds-btn large text">자주찾는 메뉴 1 <i class="svg-icon ico-more"></i></a>
  [skipNav][fail] <a href="#" class="krds-btn large text">자주찾는 메뉴 2 <i class="svg-icon ico-more"></i></a>
  [skipNav][fail] <a href="#" class="krds-btn large text">자주찾는 메뉴 3 <i class="svg-icon ico-more"></i></a>
  [skipNav][fail] <a href="#" class="krds-btn large text">자주찾는 메뉴 4 <i class="svg-icon ico-more"></i></a>
  [skipNav][fail] <a href="#">
            <div class="d-card fill">
              <div class="in">
                <div class="text">
                  <p class="c-tit">대표 서비스 카
  [skipNav][fail] <a href="#">
            <div class="d-card fill">
              <div class="in">
                <div class="text">
                  <p class="c-tit">대표 서비스 카
  [skipNav][fail] <a href="#" class="krds-btn small text">더보기 <i class="svg-icon ico-plus"></i></a>
  [skipNav][fail] <a href="#" class="tit">공지사항 제목 예시 1</a>
  [skipNav][fail] <a href="#" class="tit">공지사항 제목 예시 2</a>
  [skipNav][fail] <a href="#" class="tit">공지사항 제목 예시 3</a>
  [skipNav][fail] <a href="#" class="krds-btn medium text">바로가기 <i class="svg-icon ico-more"></i></a>

✗ search-results
  altTextBG 2/2 · skipNav 1/9 · pageTitle 1/1 · blockTitle 1/1 · linkText 10/10 · pageLang 1/1 · label 3/3
  [skipNav][fail] <a href="#" class="txt" aria-current="page">통합검색(데모)</a>
  [skipNav][fail] <a href="#">
            <p class="tit w-hide">결과 제목 예시 — <span class="keyword">검색어</span> 강조</p>
            <div class="in">
              <div class="text">

  [skipNav][fail] <a href="#">
            <p class="tit w-hide">외부 링크 결과 예시</p>
            <div class="in">
              <div class="text">
                <p class="tit m-hid
  [skipNav][fail] <a href="#" target="_blank" title="새 창 열기" class="krds-btn medium link basic">
            <span class="underline">https://example.go.kr</span> <i class="svg-ic
  [skipNav][fail] <a class="page-link active" href="#" aria-current="page">1</a>
  [skipNav][fail] <a class="page-link" href="#">2</a>
  [skipNav][fail] <a class="page-link" href="#">3</a>
  [skipNav][fail] <a class="page-navi next" href="#">다음</a>

✗ sub-page
  skipNav 1/5 · pageTitle 1/1 · blockTitle 2/2 · linkText 6/6 · pageLang 1/1
  [skipNav][fail] <a href="#" class="lnb-btn lnb-link">하위 메뉴 1-1</a>
  [skipNav][fail] <a href="#" class="lnb-btn lnb-link">하위 메뉴 1-2</a>
  [skipNav][fail] <a href="#" class="lnb-btn lnb-link">하위 메뉴 2-1</a>
  [skipNav][fail] <a href="#" class="txt" aria-current="page">서브 페이지(데모)</a>

합계: 템플릿 11종, fail/warning 66건
```

SEAT // CINEMATIC DRAW V9

실행: index.html을 Chrome/Edge로 여세요.

V9 핵심
- 카드 리빌 중앙 정렬/위치 수정
- 포커 결과 7종 랜덤화 (AA/KK 고정 제거)
- PK 스코어보드/슛 기록 UI 재작성
- BGM 라이브러리 AUTO PLAYLIST 연속재생
- assets/music + refresh_music_library.bat 로 음악 폴더 자동 등록
- HORIZONTAL PAIR MODE: 가로 2자리씩 짝
- PAIR MODE에서는 열 수 자동 짝수
- 마지막 줄은 개별 좌석 제거 가능
- PAIR HISTORY 입력 및 과거 짝 회피
- 모든 추첨 종료 후 PAIR HISTORY CHECK에서 충돌 짝을 자리 교체로 정리
- 고정 좌석은 짝 전적 교체 대상에서 제외

PAIR HISTORY 형식
김민준, 박서준
이서연, 최지우

음악
assets/music에 곡을 넣고 refresh_music_library.bat 실행 -> 새로고침.
등록곡이 있으면 AUTO PLAYLIST가 기본 Synth보다 우선됩니다.

V9: PAIR MODE setup display now groups each horizontal seat pair inside one explicit PAIR frame. A lone active seat on the last row is shown as SINGLE instead of looking paired.

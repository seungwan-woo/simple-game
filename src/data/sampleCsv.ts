export const SAMPLE_CSV_TEXT = `팀명,1번째 커맨드,2번째 커맨드,3번째 커맨드,4번째 커맨드,5번째 커맨드,6번째 커맨드,7번째 커맨드
Alpha,기 모으기,중단 공격,던지기,하단 막기,하단 공격,기 모으기,중단 공격
Beta,하단 막기,하단 막기,중단 막기,하단 공격,기 모으기,던지기,중단 막기
Gamma,중단 공격,하단 공격,중단 공격,던지기,하단 공격,중단 막기,중단 공격
Delta,기 모으기,기 모으기,하단 막기,던지기,중단 공격,하단 공격,중단 막기`;

export const downloadSampleCsv = (): void => {
  const blob = new Blob([SAMPLE_CSV_TEXT], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'code-striker-sample-teams.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

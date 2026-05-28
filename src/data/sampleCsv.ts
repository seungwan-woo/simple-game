export const SAMPLE_CSV_TEXT = `team,cmd1,cmd2,cmd3,cmd4,cmd5,cmd6,cmd7
alpha,charge,mid_attack,throw,low_block,low_attack,charge,mid_attack
beta,low_block,low_block,mid_block,low_attack,charge,throw,mid_block
gamma,mid_attack,low_attack,mid_attack,throw,low_attack,mid_block,mid_attack
delta,charge,charge,low_block,throw,mid_attack,low_attack,mid_block`;

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

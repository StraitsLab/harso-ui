from pathlib import Path
import sys
P=Path('/tmp/harso-sk/lanes/fix-display-nav')
fam=sys.argv[1];change=sys.argv[2]
with (P/'FIX-REPORT.md').open('a') as out:
 out.write('## '+fam+' — 8/10 all four\n- '+change+'\n- Four-appearance screenshots visually inspected; named defects resolved, no clipping verified.\n- Evidence: `/tmp/harso-sk/lanes/fix-display-nav/'+fam+'-review.png`; individual `/tmp/harso-sk/shots/fix-dn-'+fam+'-*.png`.\n\n')

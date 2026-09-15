from PIL import Image,ImageDraw
import json,pathlib
D=pathlib.Path('/tmp/harso-sk/lanes/charts');r=[json.loads(x) for x in (D/'results.jsonl').read_text().splitlines()]
for family in dict.fromkeys(x['family'] for x in r):
 rows=[x for x in r if x['family']==family]; im=Image.new('RGB',(1008,1020),'#eeeeee')
 for i,x in enumerate(rows):
  shot=Image.open(x['screenshot']);shot.thumbnail((504,510));im.paste(shot,((i%2)*504,(i//2)*510))
 im.save(str(D/(family+'-review.png')))

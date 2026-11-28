import json,sys,cv2,numpy as np
screens=json.load(open('/workspace/oracle-review/lab/src/data/ebs/screens.json'))
ids=sys.argv[1:] or [s['id'] for s in screens]
F=6
def ssim(a,b):
    a=a.astype(np.float64);b=b.astype(np.float64)
    k=(7,7)
    mu1=cv2.GaussianBlur(a,k,1.5);mu2=cv2.GaussianBlur(b,k,1.5)
    s11=cv2.GaussianBlur(a*a,k,1.5)-mu1*mu1;s22=cv2.GaussianBlur(b*b,k,1.5)-mu2*mu2;s12=cv2.GaussianBlur(a*b,k,1.5)-mu1*mu2
    C1=6.5025;C2=58.5225
    m=((2*mu1*mu2+C1)*(2*s12+C2))/((mu1**2+mu2**2+C1)*(s11+s22+C2))
    return m
rows=[]
for s in screens:
    if s['id'] not in ids or not s.get('ref'): continue
    ref=cv2.imread(f"/workspace/oracle-review/refs/{s['ref']}.png")
    rep=cv2.imread(f"/workspace/oracle-review/shots-ebs/{s['id']}.png")
    if rep is None: continue
    crop=ref[F:-F,F:-F]
    h,w=crop.shape[:2]
    rr=cv2.resize(rep,(w,h)) if rep.shape[:2]!=(h,w) else rep
    # mask the manual's red annotation marks
    b,g,r=[crop[:,:,i].astype(int) for i in (0,1,2)]
    red=((r>190)&(g<80)&(b<80)).astype(np.uint8)
    red=cv2.dilate(red,np.ones((5,5),np.uint8))
    ga=cv2.cvtColor(crop,cv2.COLOR_BGR2GRAY);gb=cv2.cvtColor(rr,cv2.COLOR_BGR2GRAY)
    m=ssim(ga,gb); keep=red==0
    score=float(m[keep].mean())
    diff=float(np.abs(cv2.GaussianBlur(ga,(5,5),0).astype(float)-cv2.GaussianBlur(gb,(5,5),0).astype(float))[keep].mean())
    # preview: replica | manual crop | diff heat
    heat=cv2.applyColorMap(np.clip(np.abs(ga.astype(int)-gb.astype(int)),0,255).astype(np.uint8),cv2.COLORMAP_INFERNO)
    lab=lambda im,t:(cv2.putText(im.copy(),t,(6,h-6),cv2.FONT_HERSHEY_SIMPLEX,0.5,(0,0,255),1))
    pv=np.hstack([rr,np.full((h,6,3),255,np.uint8),crop]) 
    cv2.imwrite(f"/workspace/oracle-review/compare/{s['id']}.png",pv)
    ov=np.dstack([ga,ga,gb]); ov=np.dstack([gb,gb,ga]); cv2.imwrite(f"/workspace/oracle-review/compare/{s['id']}_ov.png",ov)
    rows.append((s['id'],score,diff,rep.shape[:2]==(h,w)))
for r in sorted(rows,key=lambda r:r[1]): print(f"{r[0]:28s} ssim={r[1]:.3f} meanAbsDiff={r[2]:5.1f} sizeOK={r[3]}")

"""Build a locally signed personal-use APK using Android SDK 35 and JDK 21.
Usage: python build-android.py --sdk PLATFORM_PARENT --tools BUILD_TOOLS_DIR --jdk JDK_DIR
No Gradle, cloud build account, npm install or AI API is required.
"""
import argparse,subprocess,shutil,zipfile
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--sdk',required=True);p.add_argument('--tools',required=True);p.add_argument('--jdk',required=True);args=p.parse_args()
root=Path(__file__).resolve().parent;android=root/'android';build=root/'build';build.mkdir(exist_ok=True)
tools=Path(args.tools);jdk=Path(args.jdk)/'bin';jar=Path(args.sdk)/'android.jar'
def run(*cmd):subprocess.run([str(c) for c in cmd],check=True)
assets=build/'assets';(assets/'web').mkdir(parents=True,exist_ok=True)
shutil.copytree(root/'app',assets/'web',dirs_exist_ok=True)
run(tools/'aapt2.exe','compile','--dir',android/'res','-o',build/'resources.zip')
run(tools/'aapt2.exe','link','-I',jar,'--manifest',android/'AndroidManifest.xml','--java',build/'gen','-A',assets,'-o',build/'base.apk',build/'resources.zip')
classes=build/'classes';classes.mkdir(exist_ok=True)
javafiles=list((android/'src').rglob('*.java'))+list((build/'gen').rglob('*.java'))
argfile=build/'javac-args.txt';argfile.write_text('\n'.join('"'+str(f).replace('\\','/')+'"' for f in javafiles),encoding='utf-8')
run(jdk/'javac.exe','-encoding','UTF-8','--release','8','-classpath',jar,'-d',classes,'@'+str(argfile))
classjar=build/'classes.jar'
with zipfile.ZipFile(classjar,'w') as z:
    for f in classes.rglob('*.class'):z.write(f,f.relative_to(classes).as_posix())
dex=build/'dex';dex.mkdir(exist_ok=True)
run(jdk/'java.exe','-cp',tools/'lib/d8.jar','com.android.tools.r8.D8','--min-api','26','--lib',jar,'--output',dex,classjar)
unsigned=build/'unsigned.apk';shutil.copyfile(build/'base.apk',unsigned)
with zipfile.ZipFile(unsigned,'a') as z:
    for f in dex.glob('*.dex'):z.write(f,f.name)
aligned=build/'aligned.apk';run(tools/'zipalign.exe','-f','4',unsigned,aligned)
signing=android/'signing';signing.mkdir(exist_ok=True);key=signing/'personal-dev.p12'
if not key.exists():run(jdk/'keytool.exe','-genkeypair','-keystore',key,'-storetype','PKCS12','-storepass','android','-keypass','android','-alias','meindeutsch','-keyalg','RSA','-keysize','2048','-validity','10000','-dname','CN=Mein Deutsch Personal Build')
apk=root/'Mein-Deutsch.apk'
run(jdk/'java.exe','-jar',tools/'lib/apksigner.jar','sign','--ks',key,'--ks-key-alias','meindeutsch','--ks-pass','pass:android','--key-pass','pass:android','--out',apk,aligned)
run(jdk/'java.exe','-jar',tools/'lib/apksigner.jar','verify','--verbose',apk)
print('Built:',apk)

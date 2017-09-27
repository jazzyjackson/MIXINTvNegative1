# I found a distro I like! a minimal, headless debian wheezy running ssh by default
# described here http://www.linuxsystems.it/raspbian-wheezy-armhf-raspberry-pi-minimal-image/
# some dependencies , its OK if you already have them I'll just skip them
apt-get install p7zip-full openssl
cd ~ # wherever you are, let's go to our home directory instead
curl --remote-name http://files2.linuxsystems.it/raspbian_wheezy_20140726.img.7z
echo this hash better be identical 
echo 1be9af7fcec38c7238229edf1c5cdb3c
openssl dgst -md5 raspbian_wheezy_20140726.img.7z | awk '{print $2}'
7za x raspbian_wheezy_20140726.img.7z
echo OK now go image your SD card with raspbian_wheezy_20140726.img 
# at this point, use dd or other tool to image your flash card with  

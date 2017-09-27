# I found a distro I like! a minimal, headless debian wheezy running ssh by default
# described here http://www.linuxsystems.it/raspbian-wheezy-armhf-raspberry-pi-minimal-image/
# some dependencies , its OK if you already have them I'll just skip them
apt-get install p7zip-full openssl python
cd ~ # wherever you are, let's go to our home directory instead
curl --remote-name http://files2.linuxsystems.it/raspbian_wheezy_20140726.img.7z
echo this hash better be identical 
echo 1be9af7fcec38c7238229edf1c5cdb3c
openssl dgst -md5 raspbian_wheezy_20140726.img.7z | awk '{print $2}'
7za x raspbian_wheezy_20140726.img.7z
echo OK now go image your SD card with raspbian_wheezy_20140726.img 
# at this point, use dd or other tool to image your flash card with the image
OK now power up the rpi and ssh into it. Maybe nmap to find the thing on your net
# Run uname -m to confirm the architecture. A lapto will be x86_64, but rpi is ARM, so for me this was
# armv61 aka arm v6
# So go to https://nodejs.org/en/blog/ and look for the most up to date node available for ARMv6 32-bit Binary:
# Here's 8.5
cd ~
curl --remote-name https://nodejs.org/dist/v8.6.0/node-v8.6.0.tar.gz
gunzip node-v8.6.0.tar.gz
tar -xvf node-v8.6.0.tar
cd node-v8.6.0
./configure
make install

there's gotta be a better way to do this, ls node-v8.5, then 

cp -r bin/* /usr/local/bin
cp -r include/* usr/local/include
cp -r lib/* usr/local/lib
cp -r share/* usr/local/share

great, but we gotta
apt-get update
apt-get install build-essential

if you run out of space,
this is really helpful
https://raspberrypi.stackexchange.com/questions/499/how-can-i-resize-my-root-partition

question: will repartitioning the drive to 16GB make it 8 times as big when its compressed?
I would think all that empty space would shake itself out...

export DISPLAY=:99.0
sh -e /etc/init.d/xvfb start 
sleep 3
ember build
ember test

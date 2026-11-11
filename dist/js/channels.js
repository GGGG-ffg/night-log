/* Route-specific visual narratives, shared by the transition controller and renderer. */
Night.channels = (() => {
  const profiles = {
    home:{accent:'#d3ff38',code:'CITY / 01',words:['WAKE UP','NIGHT CITY','WELCOME'],stages:['CITY LINK / 唤醒城市','CITY DIVE / 穿过夜城','HOME ONLINE / 首页已连接'],logs:['LOCATING PERSONAL TERMINAL','TRAVERSING NIGHT CITY NETWORK','PERSONAL TERMINAL READY']},
    journal:{accent:'#68eee7',code:'ARCHIVE / 02',words:['DECRYPT','FILE SCAN','UNLOCKED'],stages:['ARCHIVE LINK / 读取档案','DATA SCAN / 扫描日志','ARCHIVE READY / 档案已解锁'],logs:['LOCATING TRANSMISSION INDEX','DECODING JOURNAL FRAGMENTS','READ ACCESS GRANTED']},
    post:{accent:'#c4a1ff',code:'READER / 02',words:['OPEN FILE','PAGE SYNC','READ ON'],stages:['READER LINK / 打开正文','PAGE SYNC / 组装页面','READER READY / 正文已就绪'],logs:['LOCATING DOCUMENT','ASSEMBLING READING SURFACE','DOCUMENT READY']},
    projects:{accent:'#ff9b5e',code:'LAB / 03',words:['COMPILE','ASSEMBLE','LAB READY'],stages:['LAB LINK / 启动工作台','BLUEPRINT / 组装蓝图','BUILD READY / 实验室已就绪'],logs:['INITIALIZING EXPERIMENT BAY','ASSEMBLING GEOMETRY','WORKBENCH ONLINE']},
    about:{accent:'#a6ffb0',code:'IDENTITY / 04',words:['IDENTIFY','ID SCAN','VERIFIED'],stages:['ID LINK / 读取身份卡','IDENTITY SCAN / 扫描档案','PROFILE READY / 身份档案已就绪'],logs:['LOCATING NΞON PROFILE','RECONSTRUCTING IDENTITY FILE','CREATOR PROFILE READY']},
    gallery:{accent:'#b6c8ff',code:'FRAMES / 06',words:['EXPOSE','DEVELOP','REMEMBER'],stages:['FRAME LINK / 打开影像档案','DEVELOP / 显影生活片段','MEMORIES READY / 风景已载入'],logs:['LOCATING PERSONAL FRAMES','ASSEMBLING THE CONTACT SHEET','TWELVE PHOTOGRAPHS / ONE DIARY']},
    contact:{accent:'#f5db67',code:'SIGNAL / 05',words:['TUNE IN','SEND SIGNAL','CONNECTED'],stages:['CHANNEL LINK / 调谐频道','PACKET FLOW / 建立信号通道','LOCAL READY / 本地终端已就绪'],logs:['TUNING MESSAGE CHANNEL','ESTABLISHING LOCAL CHANNEL','NO UPLOAD / BROWSER STORAGE']},
    terminal:{accent:'#80ff9e',code:'SHELL / SYS',words:['BOOT','SHELL LINK','ROOT READY'],stages:['SHELL BOOT / 启动终端','COMMAND LINK / 连接命令行','SHELL READY / 终端就绪'],logs:['INITIALIZING COMMAND BUFFER','MOUNTING LOCAL COMMANDS','VISITOR SESSION READY']},
    settings:{accent:'#a7bbff',code:'CONTROL / SYS',words:['CONFIG','CALIBRATE','READY'],stages:['CONTROL LINK / 读取偏好','CALIBRATE / 校准界面','CONTROL READY / 控制面板就绪'],logs:['LOADING LOCAL PREFERENCES','SYNCHRONIZING INTERFACE','CONTROL PANEL READY']},
    reader:{accent:'#ff9b5e',code:'EXPERIMENT / SYS',words:['LOAD','SIMULATE','RUN READY'],stages:['EXPERIMENT LINK / 加载实验','SIMULATION / 准备工作区','EXPERIMENT READY / 实验已就绪'],logs:['INITIALIZING EXPERIMENT','PREPARING INTERACTIVE SURFACE','EXPERIMENT READY']}
  };
  for(const [key,value] of Object.entries(profiles)) value.key=key;
  function get(route) { return typeof route==='string' && Object.hasOwn(profiles,route) ? profiles[route] : profiles.home; }
  return {get};
})();

@echo off
setlocal
set MAVEN_PROJECT_BASEDIR=%~dp0
if "%MAVEN_PROJECT_BASEDIR:~-1%"=="\" set MAVEN_PROJECT_BASEDIR=%MAVEN_PROJECT_BASEDIR:~0,-1%
set WRAPPER_JAR=%MAVEN_PROJECT_BASEDIR%\.mvn\wrapper\maven-wrapper.jar
set WRAPPER_LAUNCHER=org.apache.maven.wrapper.MavenWrapperMain

java -Dmaven.multiModuleProjectDirectory="%MAVEN_PROJECT_BASEDIR%" -classpath "%WRAPPER_JAR%" %WRAPPER_LAUNCHER% %*
if ERRORLEVEL 1 exit /b 1
exit /b 0

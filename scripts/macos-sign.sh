echo "Current operating system name:"
echo $TRAVIS_OS_NAME

if [[ "$TRAVIS_OS_NAME" == "osx" ]]; then
    echo "Attempting to sign macOS binaries"

    export CERTIFICATE_P12=Certificate.p12;
    export KEYCHAIN=build.keychain;

    echo $MACOS_SIGN_CERT | base64 --decode > $CERTIFICATE_P12;

    echo "Creating keychain..."
    security create-keychain -p travisci $KEYCHAIN;
    echo "Setting default keychain..."
    security default-keychain -s $KEYCHAIN;
    echo "Unlocking keychain..."
    security unlock-keychain -p travisci $KEYCHAIN;
    echo "Importing code signing certificate"
    security import $CERTIFICATE_P12 -k $KEYCHAIN -T /usr/bin/codesign -P "";
fi

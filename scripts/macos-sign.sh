if [[ "$TRAVIS_OS_NAME" == "osx" ]]; then
    export CERTIFICATE_P12=Certificate.p12;
    export KEYCHAIN=build.keychain;

    echo $MACOS_SIGN_CERT | base64 — decode > $CERTIFICATE_P12;

    security create-keychain -p travisci $KEYCHAIN;
    security default-keychain -s $KEYCHAIN;
    security unlock-keychain -p travisci $KEYCHAIN;
    security import $CERTIFICATE_P12 -k $KEYCHAIN -T /usr/bin/codesign;
fi
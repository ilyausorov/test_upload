import * as React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

import EditScreenInfo from '../components/EditScreenInfo';
import { Text, View } from '../components/Themed';
import { RootTabScreenProps } from '../types';

import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

export default function TabOneScreen({ navigation }: RootTabScreenProps<'TabOne'>) {
  const [isRecording, setIsRecording] = React.useState(false);
  const recording = React.useRef(null);

  const recordAudio = React.useCallback(async () => {
    try {
      await Audio.requestPermissionsAsync();

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: true,
      });

      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync({
        ...Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY,
        keepAudioActiveHint: true,
      });

      await newRecording.startAsync();
      setIsRecording(true);
      recording.current = newRecording;
    } catch (err) {
      console.log(err)
    }
  }, [])

  const finishRecording = React.useCallback(async () => {
    await recording.current?.stopAndUnloadAsync();

    const recordingURI = recording.current?.getURI() || '';
    console.log({ recordingURI });

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: true,
    });

    const { sound: newSound } = await Audio.Sound.createAsync(
      { uri: recordingURI },
      { shouldPlay: true },
    );

    newSound?.setOnPlaybackStatusUpdate(async (status) => {
      const { didJustFinish } = status;
      if (didJustFinish) {
        await newSound?.unloadAsync();
        newSound?.setOnPlaybackStatusUpdate(null);

        const requestOptions = {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'multipart/form-data',
          },
          httpMethod: 'POST',
          sessionType: FileSystem.FileSystemSessionType.FOREGROUND,
          uploadType: FileSystem.FileSystemUploadType.MULTIPART,
          fieldName: 'user_audio_file',
          parameters: {
            text: 'testing',
          },
        };

        try {
          const url = 'https://testing.com';

          console.log({ url })
          console.log({ recordingURI })
          console.log({ requestOptions })

          const result = await FileSystem.uploadAsync(url, recordingURI, requestOptions);
          console.log({ result })
        } catch (err) {
          console.log(err)
        }
      }
    });

    setIsRecording(false);
  }, [])


  return (
    <View style={styles.container}>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      {!isRecording ? (
        <TouchableOpacity onPress={recordAudio}>
          <Text>Start</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={finishRecording}>
          <Text>Stop</Text>
        </TouchableOpacity>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});

// import { Client } from "@gradio/client";
import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';

export default function HomeScreen() {
  const [userImage, setUserImage] = useState(null);
  const [clothesImage, setClothesImage] = useState(null);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const pickImage = async (setImage) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const sendToAPI = useCallback(async () => {
    if (!userImage || !clothesImage) {
      alert('Please select both images');
      return;
    }

    setIsLoading(true);
    setResult(null);
    setStatusMessage('Connecting to Gradio client...');
    const start = performance.now();
    try {
      const client = await Client.connect("Kwai-Kolors/Kolors-Virtual-Try-On");
      console.log('Connected to Gradio client');
      setStatusMessage('Submitting job...');

   
      const job = await client.submit("/tryon", [
        await fetch(userImage).then(r => r.blob()),
        await fetch(clothesImage).then(r => r.blob()),
        0,
        true,
      ]);
      console.log('Job submitted:', job);

      if (job && typeof job.next === 'function') {
        await pollForResult(job);
      } else {
        throw new Error('Invalid job object returned');
      }
    } catch (error) {
      console.error('Error calling API:', error);
      alert(`Error calling API: ${error.message}`);
      setIsLoading(false);
    }
    const end = performance.now();
    console.log(`Execution time: ${end - start} ms`);
  }, [userImage, clothesImage]);


  const pollForResult = async (job) => {
   
    try {
      console.log('Job object:', job);
      console.log('Available methods on job:', Object.keys(job));

      const maxAttempts = 30; // Maximum number of polling attempts
      let attempts = 0;

      while (attempts < maxAttempts) {

        attempts++;
        const { value, done } = await job.next();
        console.log('Iterator value:', value);

        if (done) {
          console.log('Job completed');
          break;
        }

        if (value.data) {
          console.log('Received data:', value.data);
          setStatusMessage(`Processing: ${value.data[0] || 'In progress'}`);

          // Check if we have the final result
          if (value.data[0] && typeof value.data[0] === 'object' && value.data[0].url) {
            setResult(value.data[0].url);
            break;
          }
        }

        // Wait for 2 seconds before polling again
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      if (attempts >= maxAttempts) {
        throw new Error('Polling timeout');
      }
    } catch (error) {
      console.error('Error polling for result:', error);
      alert(`Error getting result: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  
  };

  const webViewRef = useRef(null);
  const [currentUrl, setCurrentUrl] = useState('https://dlhd.sx/embed/stream-62.php');
  const initialUrl = 'https://dlhd.sx/embed/stream-62.php';
  const [isPageOpenedOnce, setIsPageOpenedOnce] = useState(false);

  const handleNavigationStateChange = (navState) => {
    if (navState.url !== initialUrl && webViewRef.current && !isPageOpenedOnce) {
      console.log('Navigating to:', navState.url);
      webViewRef.current.goBack();
      setIsPageOpenedOnce(true);
      // webViewRef.current.requestFocus();
      // BUG IN HERE
    } else if (webViewRef.current &&  isPageOpenedOnce) {
      // webViewRef.current.reload();
      webViewRef.current.goBack();
      setIsPageOpenedOnce(false);
      console.log('Reloading page');""
    }
  };

  // const handleGoBack = () => {
  //   if (webViewRef.current) {
  //     webViewRef.current.goBack();
  //     webViewRef.current.requestFocus();
  //   }
  // };  
  const handleLoadProgress = (event) => {
    console.log('Load progress:', event.nativeEvent.progress);
  };
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }
      >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Virtual Try-On</ThemedText>
        <HelloWave />
      </ThemedView>
      {/* <ThemedView style={styles.titleContainer}> */}
      {/* <WebView
      // style={styles.image}
      style={{width: 300, height: 300}}
      source={{ html: `<iframe class="video responsive" marginheight="0" marginwidth="0" src="https://dlhd.sx/embed/stream-62.php" name="iframe_a" scrolling="no" allowfullscreen="yes" width="100%" height="100%" frameborder="0">Your Browser Do not Support Iframe</iframe>`
       }}
      allowsFullscreenVideo={true}
       cacheEnabled={false}
       applicationNameForUserAgent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
    />
      </ThemedView> */}
      <ThemedView style={styles.titleContainer}>
      <WebView
      // style={styles.image}

      style={{width: 300, height: 300}}
      ref={webViewRef}
      source={{ uri: `https://dlhd.sx/embed/stream-62.php`,
     
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
        },
        method: 'GET',
        cacheEnabled: false,
        cacheMode: 'no-cache',
       }}
       onNavigationStateChange={handleNavigationStateChange}
       onLoadProgress={handleLoadProgress}
   />
        </ThemedView>
      
      <ThemedView style={styles.imageContainer}>
        <TouchableOpacity onPress={() => pickImage(setUserImage)} style={styles.imagePicker}>
          {userImage ? (
            <Image source={{ uri: userImage }} style={styles.image} />
          ) : (
            <ThemedText>Select User Image</ThemedText>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => pickImage(setClothesImage)} style={styles.imagePicker}>
          {clothesImage ? (
            <Image source={{ uri: clothesImage }} style={styles.image} />
          ) : (
            <ThemedText>Select Clothes Image</ThemedText>
          )}
        </TouchableOpacity>
      </ThemedView>
      <TouchableOpacity onPress={sendToAPI} style={styles.button} disabled={isLoading}>
        <ThemedText style={styles.buttonText}>{isLoading ? 'Processing...' : 'Try On'}</ThemedText>
      </TouchableOpacity>
      {isLoading && (
        <ThemedView>
          <ActivityIndicator size="large" color="#0000ff" />
          <ThemedText>{statusMessage}</ThemedText>
        </ThemedView>
      )}
      {result && (
        <ThemedView style={styles.resultContainer}>
          <ThemedText type="subtitle">Result:</ThemedText>
          <Image source={{ uri: result }} style={styles.resultImage} />
        </ThemedView>
          //  <iframe class="video responsive" marginheight="0" marginwidth="0" src="" name="iframe_a" scrolling="no" allowfullscreen="yes" width="100%" height="100%" frameborder="0">Your Browser Do not Support Iframe</iframe>
        
      )}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  imageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  imagePicker: {
    width: 150,
    height: 150,
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  button: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  resultContainer: {
    alignItems: 'center',
  },
  resultImage: {
    width: 300,
    height: 300,
    marginTop: 10,
  },
  reactLogo: {

    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});

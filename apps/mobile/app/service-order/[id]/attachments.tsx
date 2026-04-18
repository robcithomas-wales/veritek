import { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Image, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useServiceOrder } from '../../../hooks/use-service-order';
import { enqueue } from '../../../lib/mutation-queue/queue';
import { flushQueue } from '../../../lib/mutation-queue/sync';
import { qk } from '../../../lib/query-client';
import type { Attachment } from '@veritek/types';

export default function AttachmentsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { data: order } = useServiceOrder(id);
  const [permission, requestPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [uploading, setUploading] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const attachments: Attachment[] = order?.attachments ?? [];

  async function takePhoto() {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Camera access required', 'Please allow camera access in your device settings.');
        return;
      }
    }
    setShowCamera(true);
  }

  async function handleCapture() {
    if (!cameraRef.current) return;
    setUploading(true);
    setShowCamera(false);
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.7 });
      if (!photo?.base64) throw new Error('No image data');
      const filename = `photo_${Date.now()}.jpg`;
      enqueue(`/service-orders/${id}/attachments`, 'POST', {
        filename,
        mimeType: 'image/jpeg',
        data: photo.base64,
      });
      await flushQueue();
      await queryClient.invalidateQueries({ queryKey: qk.serviceOrder(id) });
    } catch (e) {
      Alert.alert('Upload failed', 'The photo could not be uploaded. It will retry when you are back online.');
    } finally {
      setUploading(false);
    }
  }

  if (showCamera) {
    return (
      <View style={{ flex: 1 }}>
        <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back" />
        <View style={styles.cameraBar}>
          <TouchableOpacity style={styles.captureBtn} onPress={handleCapture}>
            <View style={styles.captureBtnInner} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCamera(false)}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.count}>{attachments.length} photo{attachments.length !== 1 ? 's' : ''}</Text>
        <TouchableOpacity style={styles.addBtn} onPress={takePhoto} disabled={uploading}>
          {uploading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.addBtnText}>+ Take Photo</Text>
          )}
        </TouchableOpacity>
      </View>

      {attachments.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No photos attached yet</Text>
          <Text style={styles.emptySub}>Tap "Take Photo" to document the job</Text>
        </View>
      ) : (
        <FlatList
          data={attachments}
          keyExtractor={(a) => a.id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          renderItem={({ item }) => (
            <View style={styles.thumb}>
              <Image source={{ uri: item.url }} style={styles.thumbImg} resizeMode="cover" />
              <Text style={styles.thumbName} numberOfLines={1}>{item.filename}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  count: { fontSize: 15, fontWeight: '600', color: '#374151' },
  addBtn: { backgroundColor: '#1d4ed8', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, minWidth: 100, alignItems: 'center' },
  addBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  grid: { padding: 8 },
  thumb: { flex: 1, margin: 4, borderRadius: 8, overflow: 'hidden', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb' },
  thumbImg: { width: '100%', aspectRatio: 1 },
  thumbName: { fontSize: 11, color: '#6b7280', padding: 6 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#9ca3af', textAlign: 'center' },
  cameraBar: { backgroundColor: '#000', padding: 24, alignItems: 'center' },
  captureBtn: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  captureBtnInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff', borderWidth: 2, borderColor: '#d1d5db' },
  cancelBtn: { padding: 8 },
  cancelText: { color: '#fff', fontSize: 16 },
});

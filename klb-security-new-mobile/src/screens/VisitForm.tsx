import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator, Image, StyleSheet } from 'react-native';
import { ClipboardList, MapPin, CheckCircle, ChevronLeft, Camera, Check, ShieldAlert } from 'lucide-react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { useCustomAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
// import { useMutation } from 'convex/react';
// import { api } from '../services/convex';
import { logService } from '../services/api';
import { uploadImage } from '../services/upload';

export default function VisitForm({ route, navigation }: any) {
    const { customUser } = useCustomAuth();
    const currentUser = customUser;

    const { siteId, siteName, qrCode, organizationId, isManual } = route.params || {};
    const [remark, setRemark] = useState('');
    const [loading, setLoading] = useState(false);
    const [location, setLocation] = useState<any>(null);
    const [image, setImage] = useState<string | null>(null);
    const [reportIssue, setReportIssue] = useState(false);
    const [issueTitle, setIssueTitle] = useState('');
    const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
    const generateUploadUrl = async () => { console.log("Mocked upload url"); return ""; };
    const createDualLog = async (data: any) => { return logService.createDualLog(data); };

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission denied', 'Location permission is required for visit logs.');
                return;
            }
            let loc = await Location.getCurrentPositionAsync({});
            setLocation(loc);
        })();
    }, []);

    const handleImageCapture = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert("Permission denied", "Camera access is needed to take proof photos.");
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.4,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const handleSubmit = async () => {
        if (!location) {
            Alert.alert("Error", "Waiting for GPS signal...");
            return;
        }

        setLoading(true);
        try {
            const userToUse = currentUser;
            if (!userToUse || !userToUse.organizationId) {
                Alert.alert("Error", "User profile not loaded. Please re-login.");
                setLoading(false);
                return;
            }

            let storageId = undefined;
            if (image) {
                storageId = await uploadImage(image, generateUploadUrl);
            }

            await createDualLog({
                userId: currentUser._id as any,
                siteId: siteId as any,
                qrCode: isManual ? "MANUAL_VISIT" : qrCode,
                comment: remark,
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                organizationId: organizationId as any,
                imageId: storageId,
                issueDetails: reportIssue ? { title: issueTitle || "Visit Issue", priority } : undefined,
            });

            Alert.alert("Success", "Visit and Patrol logs submitted successfully!");
            navigation.navigate("MainTabs");
        } catch (error) {
            Alert.alert("Error", "Failed to submit visit log. Please try again.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView className="flex-1 bg-background">
            <View className="px-6 pt-12 pb-8">
                <TouchableOpacity onPress={() => navigation.goBack()} className="mb-6">
                    <ChevronLeft color="white" size={24} />
                </TouchableOpacity>

                <Text style={styles.headerLabel}>Submit Visit Log</Text>
                <Text style={styles.headerTitle}>{isManual ? "Manual Visit" : "Officer Visit"}</Text>
                <Text style={styles.siteSubtitle}>{siteName}</Text>
            </View>

            <View className="px-6 space-y-6">
                {/* Photo Capture Area */}
                <View className="bg-card rounded-3xl border border-white/10 overflow-hidden">
                    <TouchableOpacity
                        onPress={handleImageCapture}
                        className="items-center justify-center min-h-[160px]"
                    >
                        {image ? (
                            <View className="w-full h-[200px] relative">
                                <Image source={{ uri: image }} className="w-full h-full" resizeMode="cover" />
                                <View className="absolute top-3 right-3 bg-emerald-500 w-8 h-8 rounded-full items-center justify-center shadow-lg">
                                    <Check color="white" size={16} />
                                </View>
                                <View className="absolute bottom-3 left-3 bg-black/60 px-3 py-1.5 rounded-xl border border-white/10">
                                    <Text className="text-white text-[10px] font-bold uppercase">Change Photo</Text>
                                </View>
                            </View>
                        ) : (
                            <>
                                <View className="w-16 h-16 bg-white/5 rounded-2xl items-center justify-center mb-3">
                                    <Camera color="#64748b" size={32} />
                                </View>
                                <Text className="text-muted text-xs font-semibold">Capture Photo Proof</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {/* QR Data Info */}
                <View className="bg-card p-5 rounded-3xl border border-white/5 flex-row items-center">
                    <ClipboardList color="#3b82f6" size={20} className="mr-3" />
                    <View>
                        <Text className="text-white font-bold text-sm">QR Validated</Text>
                        <Text className="text-muted text-[10px] uppercase">{qrCode}</Text>
                    </View>
                </View>

                {/* GPS Status */}
                <View className="bg-card p-5 rounded-3xl border border-white/5 flex-row items-center justify-between">
                    <View className="flex-row items-center">
                        <MapPin color={location ? "#10b981" : "#64748b"} size={18} className="mr-2" />
                        <Text className="text-white font-bold text-sm">Location Capture</Text>
                    </View>
                    <Text className="text-emerald-500 text-[10px] uppercase font-bold">
                        {location ? "Captured" : "Locating..."}
                    </Text>
                </View>

                {/* Remark Input */}
                <View className="bg-card p-5 rounded-3xl border border-white/10">
                    <Text className="text-muted text-[10px] uppercase font-bold mb-3 tracking-widest">Remarks / Observations</Text>
                    <TextInput
                        multiline
                        numberOfLines={4}
                        placeholder="Add visit notes..."
                        placeholderTextColor="#475569"
                        className="text-white text-sm min-h-[100px]"
                        value={remark}
                        onChangeText={setRemark}
                    />
                </View>

                {/* Report Issue Toggle */}
                <View className="bg-card p-5 rounded-3xl border border-white/10">
                    <View className="flex-row items-center justify-between mb-4">
                        <View className="flex-row items-center">
                            <ShieldAlert color={reportIssue ? "#f43f5e" : "#64748b"} size={20} />
                            <Text className="text-white font-bold text-sm ml-2">Report an Issue</Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => setReportIssue(!reportIssue)}
                            className={cn(
                                "w-12 h-6 rounded-full px-1 justify-center",
                                reportIssue ? "bg-red-500" : "bg-zinc-800"
                            )}
                        >
                            <View className={cn(
                                "w-4 h-4 rounded-full bg-white",
                                reportIssue ? "ml-auto" : "ml-0"
                            )} />
                        </TouchableOpacity>
                    </View>

                    {reportIssue && (
                        <View className="space-y-4 pt-2 border-t border-white/5">
                            <View>
                                <Text className="text-muted text-[10px] uppercase font-bold mb-2 tracking-widest">Issue Title</Text>
                                <TextInput
                                    placeholder="e.g. Broken Gate, Water Leak"
                                    placeholderTextColor="#475569"
                                    className="text-white text-sm bg-black/20 p-3 rounded-xl border border-white/5"
                                    value={issueTitle}
                                    onChangeText={setIssueTitle}
                                />
                            </View>

                            <View>
                                <Text className="text-muted text-[10px] uppercase font-bold mb-2 tracking-widest">Priority</Text>
                                <View className="flex-row gap-2">
                                    {["Low", "Medium", "High"].map((p: any) => (
                                        <TouchableOpacity
                                            key={p}
                                            onPress={() => setPriority(p)}
                                            className={cn(
                                                "flex-1 py-2 rounded-xl items-center border",
                                                priority === p
                                                    ? (p === 'High' ? "bg-red-500/20 border-red-500" : "bg-primary/20 border-primary")
                                                    : "bg-black/20 border-white/5"
                                            )}
                                        >
                                            <Text className={cn(
                                                "text-[10px] font-bold",
                                                priority === p ? (p === 'High' ? "text-red-500" : "text-primary") : "text-muted"
                                            )}>{p}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </View>
                    )}
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={loading}
                    style={{
                        backgroundColor: '#2563eb',
                        padding: 20,
                        borderRadius: 24,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: 20,
                        marginBottom: 40
                    }}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <CheckCircle color="white" size={20} style={{ marginRight: 8 }} />
                            <Text className="text-white font-bold text-lg">Submit Visit</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    header: { paddingHorizontal: 24, paddingTop: 48, paddingBottom: 32, backgroundColor: '#020617' },
    backBtn: { marginBottom: 24 },
    headerLabel: { color: '#64748b', fontSize: 10, fontWeight: 'bold' as const, textTransform: 'uppercase', letterSpacing: 2 },
    headerTitle: { color: 'white', fontSize: 24, fontWeight: 'bold' as const },
    siteSubtitle: { color: '#3b82f6', fontSize: 14, fontWeight: '600' as const, marginTop: 4 },
    container: { flex: 1, backgroundColor: '#020617' },
});

import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, Zap, ZapOff, Info } from 'lucide-react-native';
// import { useQuery } from 'convex/react';
// import { api } from '../services/convex';
import { siteService } from '../services/api';
import { usePatrolStore } from '../store/usePatrolStore';
import { useCustomAuth } from '../context/AuthContext';
import * as Location from 'expo-location';

const { width } = Dimensions.get('window');

export default function QRScanner() {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [torch, setTorch] = useState(false);
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { customUser } = useCustomAuth();
    const activeSession = usePatrolStore((state) => state.activeSession);

    const { isVisit, siteId, siteName, mode, pointId, pointName } = route.params || {};

    const [targetSite, setTargetSite] = useState<any>(null);
    useEffect(() => {
        if (mode === 'setup' && siteId) {
            // Using getAllSites for now and filtering since getSiteById isn't in api.ts yet
            siteService.getAllSites()
                .then((res: any) => {
                    const site = res.data.find((s: any) => s._id === siteId);
                    setTargetSite(site);
                })
                .catch((err: any) => console.error("Error fetching site details:", err));
        }
    }, [mode, siteId]);

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371000; // Radius of the earth in meters
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in meters
    };

    if (!permission) return <View style={styles.container} />;

    if (!permission.granted) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.text}>We need your permission to show the camera</Text>
                <TouchableOpacity style={styles.button} onPress={requestPermission}>
                    <Text style={styles.buttonText}>Grant Permission</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const handleBarCodeScanned = async ({ data }: any) => {
        if (scanned) return;
        setScanned(true);

        if (mode === 'setup') {
            if (!targetSite) {
                Alert.alert("Error", "Site data not found.");
                setScanned(false);
                return;
            }

            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert("Permission Error", "Location permission is required for setup.");
                    setScanned(false);
                    return;
                }

                const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
                const distance = calculateDistance(
                    location.coords.latitude,
                    location.coords.longitude,
                    targetSite.latitude,
                    targetSite.longitude
                );

                if (distance > 100) {
                    Alert.alert(
                        "Geo-fence Error",
                        `You are too far from the site (${Math.round(distance)}m). You must be within 100m to setup a point.`
                    );
                    setScanned(false);
                    return;
                }

                navigation.navigate('CreatePoint', {
                    mode: 'setup',
                    siteId,
                    pointId,
                    pointName,
                    qrCode: data,
                    lat: location.coords.latitude.toString(),
                    lng: location.coords.longitude.toString()
                });
            } catch (error) {
                console.error(error);
                Alert.alert("Location Error", "Could not verify your location.");
                setScanned(false);
            }
        } else if (isVisit) {
            navigation.navigate('VisitForm', {
                qrCode: data,
                siteId: siteId,
                siteName: siteName,
                organizationId: customUser?.organizationId
            });
        } else {
            // Pass data to PatrolForm for validation and logging
            navigation.navigate('PatrolForm', { qrCode: data });
        }

        // Reset scanned after 2 seconds to allow re-entry if back
        setTimeout(() => setScanned(false), 2000);
    };

    return (
        <View style={styles.container}>
            <CameraView
                style={StyleSheet.absoluteFillObject}
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                enableTorch={torch}
            />

            {/* Overlay */}
            <View style={styles.overlay}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                        <ArrowLeft color="white" size={24} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{mode === 'setup' ? 'Setup Point' : 'Scan Patrol Point'}</Text>
                    <TouchableOpacity onPress={() => setTorch(!torch)} style={styles.iconBtn}>
                        {torch ? <Zap color="#f59e0b" size={24} fill="#f59e0b" /> : <ZapOff color="white" size={24} />}
                    </TouchableOpacity>
                </View>

                <View style={styles.scannerOuter}>
                    <View style={styles.scannerInner}>
                        <View style={styles.cornerTopLeft} />
                        <View style={styles.cornerTopRight} />
                        <View style={styles.cornerBottomLeft} />
                        <View style={styles.cornerBottomRight} />
                    </View>
                </View>

                <View style={styles.footer}>
                    <View style={styles.infoBox}>
                        <Info color="#3b82f6" size={20} />
                        <Text style={styles.infoText}>
                            {mode === 'setup' 
                                ? "Scan the QR code to register this point at your current location."
                                : "Align the QR code within the frame to scan automatically."}
                        </Text>
                    </View>
                    <Text style={styles.sessionInfo}>
                        Active: {activeSession?.siteName || "Current Session"}
                    </Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        backgroundColor: '#020617',
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'space-between',
        paddingBottom: 60,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 60,
        paddingHorizontal: 24,
    },
    headerTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    iconBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scannerOuter: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    scannerInner: {
        width: width * 0.7,
        height: width * 0.7,
        borderWidth: 0,
        position: 'relative',
    },
    cornerTopLeft: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: 40,
        height: 40,
        borderTopWidth: 4,
        borderLeftWidth: 4,
        borderColor: '#2563eb',
    },
    cornerTopRight: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 40,
        height: 40,
        borderTopWidth: 4,
        borderRightWidth: 4,
        borderColor: '#2563eb',
    },
    cornerBottomLeft: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: 40,
        height: 40,
        borderBottomWidth: 4,
        borderLeftWidth: 4,
        borderColor: '#2563eb',
    },
    cornerBottomRight: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 40,
        height: 40,
        borderBottomWidth: 4,
        borderRightWidth: 4,
        borderColor: '#2563eb',
    },
    footer: {
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 16,
        borderRadius: 16,
        gap: 12,
        marginBottom: 20,
    },
    infoText: {
        color: 'white',
        fontSize: 14,
        flex: 1,
    },
    sessionInfo: {
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    text: {
        color: 'white',
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 24,
    },
    button: {
        backgroundColor: '#2563eb',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
    },
});

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// import { useMutation } from 'convex/react';
// import { api } from '../services/convex';
import { usePatrolStore } from '../store/usePatrolStore';
import { Play, ArrowLeft, Shield, MapPin, Clock } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useCustomAuth } from '../context/AuthContext';

export default function PatrolStart() {
    const navigation = useNavigation<any>();
    const currentSite = usePatrolStore((state) => state.currentSite);
    const { userId } = useCustomAuth();
    // const startSession = useMutation(api.patrolSessions.startSession);
    const startSession = async (data: any) => { console.log('Mocked startSession', data); };
    const [loading, setLoading] = useState(false);

    if (!currentSite) return null;

    const handleStart = async () => {
        setLoading(true);
        try {
            await startSession({
                siteId: currentSite._id,
                organizationId: currentSite.organizationId,
                userId: userId as any,
            });
            navigation.navigate('QRScanner');
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft color="white" size={24} />
                </TouchableOpacity>
                <Text style={styles.title}>Confirm Patrol</Text>
            </View>

            <View style={styles.content}>
                <View style={styles.heroCard}>
                    <View style={styles.shieldDecoration}>
                        <Shield color="#3b82f6" size={80} />
                    </View>
                    <Text style={styles.readyText}>Ready to start duty?</Text>
                    <Text style={styles.descText}>
                        You are about to begin a patrol session at {currentSite.name}.
                    </Text>
                </View>

                <View style={styles.detailsList}>
                    <View style={styles.detailItem}>
                        <MapPin color="#64748b" size={24} />
                        <View>
                            <Text style={styles.detailLabel}>Location</Text>
                            <Text style={styles.detailValue}>{currentSite.name}</Text>
                        </View>
                    </View>
                    <View style={styles.detailItem}>
                        <Clock color="#64748b" size={24} />
                        <View>
                            <Text style={styles.detailLabel}>Type</Text>
                            <Text style={styles.detailValue}>Standard Patrol Session</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.startBtn}
                        onPress={handleStart}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <Play color="white" size={24} fill="white" />
                                <Text style={styles.startText}>START PATROL NOW</Text>
                            </>
                        )}
                    </TouchableOpacity>
                    <Text style={styles.disclaimer}>
                        Your GPS location will be tracked during the session.
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#020617',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 24,
        gap: 16,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#0f172a',
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
    },
    content: {
        flex: 1,
        padding: 24,
    },
    heroCard: {
        backgroundColor: '#0f172a',
        borderRadius: 32,
        padding: 32,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        marginBottom: 32,
    },
    shieldDecoration: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    readyText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
    },
    descText: {
        fontSize: 16,
        color: '#64748b',
        textAlign: 'center',
        marginTop: 12,
        lineHeight: 24,
    },
    detailsList: {
        gap: 20,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        backgroundColor: '#0f172a',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    detailLabel: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    detailValue: {
        fontSize: 16,
        color: 'white',
        fontWeight: '600',
        marginTop: 2,
    },
    footer: {
        marginTop: 'auto',
    },
    startBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2563eb',
        padding: 20,
        borderRadius: 24,
        gap: 12,
    },
    startText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: 1,
    },
    disclaimer: {
        color: '#475569',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 16,
    },
});

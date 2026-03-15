import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// import { useQuery } from 'convex/react';
// import { api } from '../../services/convex';
import { siteService, pointService } from '../../services/api';
import { usePatrolStore } from '../../store/usePatrolStore';
import { Scan, Clock, CheckCircle, AlertTriangle, Building2, MapPin, LogOut } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useCustomAuth } from '../../context/AuthContext';
import { SiteHistoryPreview } from '../../components/SiteHistoryPreview';
import { useMutation } from 'convex/react';

export default function HomeScreen() {
    const navigation = useNavigation<any>();
    const { userId, customUser, logout } = useCustomAuth();
    const [activeSession, setActiveSession] = useState<any>(null); // Still need to migrate getActiveSession
    const [sites, setSites] = useState<any[]>([]);

    React.useEffect(() => {
        if (userId) {
            const fetchSites = async () => {
                try {
                    const response = await siteService.getAllSites();
                    setSites(response.data);
                } catch (error) {
                    console.error("Error fetching sites:", error);
                }
            };
            fetchSites();
        }
    }, [userId]);
    const endSession = async (options: any) => { console.log('Mocked end session', options); };
    const setSession = usePatrolStore((state) => state.setSession);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (activeSession) {
            setSession({
                id: activeSession._id,
                siteId: activeSession.siteId,
                siteName: "", // We can look this up
                startTime: activeSession.startTime,
                scannedPointIds: activeSession.scannedPoints
            });
        } else {
            setSession(null);
        }
    }, [activeSession]);

    const onRefresh = () => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1000);
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />}
            >
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Security Dashboard</Text>
                        <Text style={styles.subGreeting}>Monitor and manage patrols</Text>
                    </View>
                    <View style={styles.headerRight}>
                        <View style={styles.profileBadge}>
                            <Building2 color="#2563eb" size={20} />
                        </View>
                        <TouchableOpacity
                            onPress={() => logout()}
                            style={styles.logoutBtn}
                        >
                            <Text style={styles.logoutText}>Log Out</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Active Session Status / Start Action */}
                {activeSession ? (
                    <View style={styles.activeSessionCard}>
                        <View style={styles.activeBadge}>
                            <View style={styles.pulse} />
                            <Text style={styles.activeText}>ACTIVE SESSION</Text>
                        </View>
                        <Text style={styles.activeSiteTitle}>Currently patrolling Site</Text>
                        <Text style={styles.progressText}>
                            Scanned {activeSession.scannedPoints?.length || 0} points
                        </Text>
                        <View style={styles.activeActions}>
                            <TouchableOpacity
                                style={styles.resumeBtn}
                                onPress={() => navigation.navigate('QRScanner')}
                            >
                                <Scan color="white" size={20} />
                                <Text style={styles.resumeText}>Resume Patrol</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.stopBtn}
                                onPress={() => endSession({ sessionId: activeSession._id })}
                            >
                                <LogOut color="#ef4444" size={20} />
                                <Text style={styles.stopText}>Stop</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <View style={styles.actionContainer}>
                        {customUser?.role === 'SG' ? (
                            <TouchableOpacity
                                style={styles.startPatrolBar}
                                onPress={() => navigation.navigate('SiteSelection')}
                            >
                                <View style={styles.startIcon}>
                                    <Scan color="white" size={24} />
                                </View>
                                <View>
                                    <Text style={styles.startTitle}>Start New Patrol</Text>
                                    <Text style={styles.startSub}>Select a site to begin scanning</Text>
                                </View>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={[styles.startPatrolBar, { backgroundColor: '#1e1b4b', borderColor: '#312e81' }]}
                                onPress={() => navigation.navigate('SiteSelection', { isVisit: true })}
                            >
                                <View style={[styles.startIcon, { backgroundColor: '#4338ca' }]}>
                                    <CheckCircle color="white" size={24} />
                                </View>
                                <View>
                                    <Text style={styles.startTitle}>Training Visit</Text>
                                    <Text style={[styles.startSub, { color: '#818cf8' }]}>Submit officer training & visit report</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <Clock color="#cbd5e1" size={20} />
                        <Text style={styles.statValue}>12h</Text>
                        <Text style={styles.statLabel}>Today's Duty</Text>
                    </View>
                    <View style={styles.statCard}>
                        <CheckCircle color="#10b981" size={20} />
                        <Text style={styles.statValue}>24</Text>
                        <Text style={styles.statLabel}>Total Scans</Text>
                    </View>
                    <View style={styles.statCard}>
                        <AlertTriangle color="#f59e0b" size={20} />
                        <Text style={styles.statValue}>2</Text>
                        <Text style={styles.statLabel}>Incidents</Text>
                    </View>
                </View>

                {/* Sites List */}
                <Text style={styles.sectionTitle}>Your Assigned Sites</Text>
                {sites?.map((site) => (
                    <TouchableOpacity
                        key={site._id}
                        onPress={() => navigation.navigate('SiteSelection', { selectedSiteId: site._id })}
                    >
                        <View style={styles.siteCard}>
                            <View style={styles.siteMain}>
                                <View style={styles.siteIcon}>
                                    <Building2 color="#64748b" size={24} />
                                </View>
                                <View style={styles.siteInfo}>
                                    <Text style={styles.siteName}>{site.name}</Text>
                                    <View style={styles.locationRow}>
                                        <MapPin color="#94a3b8" size={14} />
                                        <Text style={styles.locationText}>{site.locationName}</Text>
                                    </View>
                                </View>
                                <CheckCircle color="#10b981" size={20} />
                            </View>
                            <SiteHistoryPreview siteId={site._id} />
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#020617',
    },
    scrollContent: {
        padding: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    logoutBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    logoutText: {
        color: '#ef4444',
        fontSize: 11,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    greeting: {
        fontSize: 28,
        fontWeight: 'bold',
        color: 'white',
    },
    subGreeting: {
        fontSize: 16,
        color: '#64748b',
        marginTop: 4,
    },
    profileBadge: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(37, 99, 235, 0.2)',
    },
    startPatrolBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0f172a',
        padding: 20,
        borderRadius: 24,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        gap: 16,
    },
    startIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#2563eb',
        justifyContent: 'center',
        alignItems: 'center',
    },
    startTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    },
    startSub: {
        fontSize: 14,
        color: '#64748b',
        marginTop: 2,
    },
    activeSessionCard: {
        backgroundColor: '#0f172a',
        padding: 24,
        borderRadius: 32,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: '#1e293b',
        alignItems: 'center',
    },
    activeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 12,
        gap: 8,
    },
    pulse: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#10b981',
    },
    activeText: {
        color: '#10b981',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    activeSiteTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    resumeBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2563eb',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 16,
        gap: 10,
        justifyContent: 'center',
    },
    resumeText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    activeActions: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    stopBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 16,
        gap: 8,
    },
    stopText: {
        color: '#ef4444',
        fontSize: 16,
        fontWeight: 'bold',
    },
    siteMain: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    actionContainer: {
        marginBottom: 32,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 32,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#0f172a',
        padding: 16,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        alignItems: 'center',
        gap: 8,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
    statLabel: {
        fontSize: 11,
        color: '#64748b',
        fontWeight: '600',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 16,
    },
    siteCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0f172a',
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        gap: 16,
    },
    siteIcon: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: '#1e293b',
        justifyContent: 'center',
        alignItems: 'center',
    },
    siteInfo: {
        flex: 1,
    },
    siteName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    locationText: {
        fontSize: 13,
        color: '#64748b',
    },
    progressText: {
        color: '#3b82f6',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 16,
    },
});

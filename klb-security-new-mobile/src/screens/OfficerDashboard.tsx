import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Building2, User, Clock, ClipboardList, ChevronRight, MapPin, Search, LogOut } from 'lucide-react-native';
// import { useQuery } from 'convex/react';
// import { api } from '../services/convex';
import { siteService, logService } from '../services/api';
import { useCustomAuth } from '../context/AuthContext';
import { TextInput, Alert } from 'react-native';

export default function OfficerDashboard() {
    const { organizationId, userId, logout } = useCustomAuth();
    const [selectedSiteId, setSelectedSiteId] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    
    const handleLogout = () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to logout?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Logout", style: "destructive", onPress: () => logout() }
            ]
        );
    };
    const [sites, setSites] = useState<any[]>([]);
    const [patrolLogs, setPatrolLogs] = useState<any[]>([]);
    const [visitLogs, setVisitLogs] = useState<any[]>([]);

    React.useEffect(() => {
        if (userId) {
            siteService.getAllSites()
                .then(res => setSites(res.data))
                .catch(err => console.error("Error fetching sites:", err));
        }
    }, [userId]);

    React.useEffect(() => {
        if (organizationId) {
            logService.getPatrolLogs(organizationId as string, selectedSiteId || undefined)
                .then(res => setPatrolLogs(res.data))
                .catch(err => console.error("Error fetching patrol logs:", err));
                
            logService.getVisitLogs(organizationId as string)
                .then(res => setVisitLogs(res.data))
                .catch(err => console.error("Error fetching visit logs:", err));
        }
    }, [organizationId, selectedSiteId]);

    const filteredVisitLogs = visitLogs?.filter(log => log.siteId === selectedSiteId);

    // Mock "Current Guard" - in a real app, this would be a specialized query
    const currentGuard = patrolLogs?.length ? patrolLogs[0].userName : "No guard active";
    const lastPatrol = patrolLogs?.length ? new Date(patrolLogs[0].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "None today";

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Officer Dashboard</Text>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                    <LogOut color="#ef4444" size={20} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.searchSection}>
                    <View style={styles.searchContainer}>
                        <Search color="#64748b" size={18} style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search assigned sites..."
                            placeholderTextColor="#64748b"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery !== "" && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Text style={{ color: '#64748b', fontSize: 12 }}>Clear</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {selectedSiteId ? (
                    <View style={styles.activeSiteSection}>
                        <View style={styles.activeSiteHeader}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.activeSiteLabel}>Monitoring Site</Text>
                                <Text style={styles.activeSiteName}>
                                    {sites?.find(s => s._id === selectedSiteId)?.name || 'Unknown Site'}
                                </Text>
                            </View>
                            <TouchableOpacity 
                                style={styles.changeSiteBtn}
                                onPress={() => setSelectedSiteId(null)}
                            >
                                <Text style={styles.changeSiteText}>Change Site</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.statsGrid}>
                            <View style={styles.statCard}>
                                <View style={styles.statIconBox}>
                                    <User color="#3b82f6" size={20} />
                                </View>
                                <View>
                                    <Text style={styles.statLabel}>Current Guard</Text>
                                    <Text style={styles.statValue} numberOfLines={1}>{currentGuard}</Text>
                                </View>
                            </View>
                            <View style={styles.statCard}>
                                <View style={[styles.statIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                                    <Clock color="#10b981" size={20} />
                                </View>
                                <View>
                                    <Text style={styles.statLabel}>Last Patrol</Text>
                                    <Text style={styles.statValue}>{lastPatrol}</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.fullWidthCard}>
                            <View style={styles.cardHeader}>
                                <ClipboardList color="#3b82f6" size={18} />
                                <Text style={styles.cardTitle}>Recent Activity</Text>
                            </View>
                            {patrolLogs && patrolLogs.length > 0 ? (
                                patrolLogs.slice(0, 3).map((log, i) => (
                                    <View key={log._id} style={styles.logRow}>
                                        <View style={[styles.logDot, { backgroundColor: log.distance > 100 ? '#ef4444' : '#22c55e' }]} />
                                        <View style={styles.logInfo}>
                                            <Text style={styles.logText}>{log.pointName}</Text>
                                            <Text style={styles.logSubtext}>{log.userName} • {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                                        </View>
                                        <ChevronRight size={14} color="#334155" />
                                    </View>
                                ))
                            ) : (
                                <Text style={styles.emptyText}>No recent patrols today.</Text>
                            )}
                        </View>

                        <View style={styles.fullWidthCard}>
                            <View style={styles.cardHeader}>
                                <MapPin color="#3b82f6" size={18} />
                                <Text style={styles.cardTitle}>Visiting Reports</Text>
                            </View>
                            {filteredVisitLogs && filteredVisitLogs.length > 0 ? (
                                filteredVisitLogs.slice(0, 3).map((log) => (
                                    <View key={log._id} style={styles.logRow}>
                                        <View style={[styles.logDot, { backgroundColor: '#3b82f6' }]} />
                                        <View style={styles.logInfo}>
                                            <Text style={styles.logText}>{log.userName}</Text>
                                            <Text style={styles.logSubtext}>{new Date(log.createdAt).toLocaleString()}</Text>
                                        </View>
                                        <ChevronRight size={14} color="#334155" />
                                    </View>
                                ))
                            ) : (
                                <Text style={styles.emptyText}>No visiting reports for this site.</Text>
                            )}
                        </View>
                    </View>
                ) : (
                    <View style={styles.siteSelector}>
                        <Text style={styles.sectionTitle}>Select Site to Monitor</Text>
                        <View style={styles.siteGrid}>
                            {sites?.filter(site => site.name.toLowerCase().includes(searchQuery.toLowerCase())).map(site => (
                                <TouchableOpacity
                                    key={site._id}
                                    style={styles.siteCard}
                                    onPress={() => setSelectedSiteId(site._id)}
                                >
                                    <View style={styles.siteIconBox}>
                                        <Building2 size={24} color="#3b82f6" />
                                    </View>
                                    <View style={styles.siteInfo}>
                                        <Text style={styles.siteNameText} numberOfLines={1}>{site.name}</Text>
                                        <Text style={styles.siteLocationText} numberOfLines={1}>{site.locationName}</Text>
                                    </View>
                                    <ChevronRight size={20} color="#334155" />
                                </TouchableOpacity>
                            ))}
                            {sites?.filter(site => site.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                                <View style={styles.emptyState}>
                                    <Search color="#1e293b" size={64} />
                                    <Text style={styles.emptyTitle}>No Sites Found</Text>
                                    <Text style={styles.emptyText}>Try searching with a different name.</Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#020617' },
    header: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 12
    },
    title: { fontSize: 24, fontWeight: 'bold', color: 'white' },
    logoutBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    content: { padding: 24 },
    searchSection: {
        marginBottom: 20,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0f172a',
        paddingHorizontal: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        height: 52,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        color: 'white',
        fontSize: 15,
    },
    siteSelector: { 
        marginBottom: 32,
    },
    sectionTitle: { 
        fontSize: 12, 
        fontWeight: 'bold' as const, 
        color: '#475569', 
        textTransform: 'uppercase', 
        letterSpacing: 1.5, 
        marginBottom: 20 
    },
    siteGrid: { 
        gap: 12 
    },
    siteCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0f172a',
        padding: 20,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.2)', // Slightly more visible border
        gap: 16,
        width: '100%', // Ensure all cards have the same width
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    siteIconBox: {
        width: 50,
        height: 50,
        borderRadius: 14,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    siteInfo: {
        flex: 1,
    },
    siteNameText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold' as const,
    },
    siteLocationText: {
        color: '#64748b',
        fontSize: 13,
        marginTop: 2,
    },
    activeSiteSection: {
        gap: 16,
    },
    activeSiteHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        padding: 20,
        borderRadius: 28,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#3b82f6',
        gap: 12,
    },
    activeSiteLabel: {
        color: '#3b82f6',
        fontSize: 11,
        fontWeight: 'bold' as const,
        textTransform: 'uppercase',
        letterSpacing: 1.2,
    },
    activeSiteName: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold' as const,
        marginTop: 2,
    },
    changeSiteBtn: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
    },
    changeSiteText: {
        color: '#64748b',
        fontSize: 12,
        fontWeight: '600' as const,
    },
    statsGrid: { 
        flexDirection: 'row',
        gap: 12 
    },
    statCard: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0f172a',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        gap: 12,
    },
    statIconBox: { 
        width: 44, 
        height: 44, 
        borderRadius: 12, 
        backgroundColor: 'rgba(59, 130, 246, 0.1)', 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    statLabel: { color: '#64748b', fontSize: 11, fontWeight: 'bold' as const, textTransform: 'uppercase' },
    statValue: { color: 'white', fontSize: 16, fontWeight: 'bold' as const, marginTop: 2 },
    fullWidthCard: {
        backgroundColor: '#0f172a',
        padding: 20,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 20,
    },
    cardTitle: { color: 'white', fontSize: 16, fontWeight: 'bold' as const },
    logRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 12, 
        marginBottom: 12,
        padding: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderRadius: 16,
    },
    logDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22c55e' },
    logInfo: { flex: 1 },
    logText: { color: 'white', fontSize: 14, fontWeight: '600' as const },
    logSubtext: { color: '#64748b', fontSize: 11, marginTop: 2 },
    emptyState: { alignItems: 'center', marginTop: 100 },
    emptyTitle: { color: 'white', fontSize: 20, fontWeight: 'bold' as const, marginTop: 24, marginBottom: 8 },
    emptyText: { color: '#64748b', fontSize: 14, textAlign: 'center' },
});

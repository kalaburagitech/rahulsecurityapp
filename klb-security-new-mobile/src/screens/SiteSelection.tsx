import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// import { useQuery } from 'convex/react';
// import { api } from '../services/convex';
import { siteService } from '../services/api';
import { Building2, Search, MapPin, ChevronRight, ArrowLeft } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { usePatrolStore } from '../store/usePatrolStore';
import { useCustomAuth } from '../context/AuthContext';

export default function SiteSelection() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { userId } = useCustomAuth();
    const [sites, setSites] = useState<any[]>([]);

    React.useEffect(() => {
        if (userId) {
            // Depending on how organizationId vs userId is handled in your REST backend,
            // we will fetch all sites for now and filter by the correct field or use the getSitesByOrg endpoint.
            // Using a hardcoded standard route or querying /sites/all if the admin gets everything.
            // For now, assuming you need to fetch all sites for the org
            const fetchSites = async () => {
                try {
                    // Let's use getAllSites temporarily if orgId isn't easily available here,
                    // or assume the backend correctly filters. We'll try getAllSites first.
                    const response = await siteService.getAllSites();
                    setSites(response.data);
                } catch (error) {
                    console.error("Error fetching sites:", error);
                }
            };
            fetchSites();
        }
    }, [userId]);
    const [searchQuery, setSearchQuery] = useState('');
    const setCurrentSite = usePatrolStore((state) => state.setCurrentSite);

    const filteredSites = sites?.filter(site =>
        site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        site.locationName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const isVisit = route.params?.isVisit;

    const handleSelectSite = (site: any) => {
        setCurrentSite(site);
        if (isVisit) {
            navigation.navigate('QRScanner', { isVisit: true, siteId: site._id, siteName: site.name });
        } else {
            navigation.navigate('PatrolStart');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft color="white" size={24} />
                </TouchableOpacity>
                <Text style={styles.title}>Select Site</Text>
            </View>

            <View style={styles.searchContainer}>
                <Search color="#64748b" size={20} style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search patrol sites..."
                    placeholderTextColor="#64748b"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            <FlatList
                data={filteredSites}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.siteItem}
                        onPress={() => handleSelectSite(item)}
                    >
                        <View style={styles.iconContainer}>
                            <Building2 color="#3b82f6" size={24} />
                        </View>
                        <View style={styles.info}>
                            <Text style={styles.siteName}>{item.name}</Text>
                            <View style={styles.locationRow}>
                                <MapPin color="#64748b" size={14} />
                                <Text style={styles.location}>{item.locationName}</Text>
                            </View>
                        </View>
                        <ChevronRight color="#334155" size={20} />
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No sites found matching your search</Text>
                    </View>
                }
            />
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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0f172a',
        marginHorizontal: 24,
        paddingHorizontal: 16,
        borderRadius: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    searchIcon: {
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        height: 56,
        color: 'white',
        fontSize: 16,
    },
    listContent: {
        paddingHorizontal: 24,
        paddingBottom: 24,
    },
    siteItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0f172a',
        padding: 16,
        borderRadius: 24,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        gap: 16,
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 18,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    info: {
        flex: 1,
    },
    siteName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    location: {
        fontSize: 14,
        color: '#64748b',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 64,
    },
    emptyText: {
        color: '#64748b',
        fontSize: 16,
    },
});

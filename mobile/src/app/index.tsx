import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Pressable,
  Modal,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


const getApiUrl = () => {
  if (Platform.OS === 'web') {
    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    return `http://${hostname}:3000`;
  }
  return 'http://192.168.254.119:3000';
};

const API_URL = getApiUrl();

interface Mission {
  id: string;
  organization_id: string;
  title: string;
  points: number;
  status: string;
}

export default function HomeScreen() {
  const [activeOrg, setActiveOrg] = useState<'org-a' | 'org-b'>('org-a');
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Modal State
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [submitHeaderOrg, setSubmitHeaderOrg] = useState<'org-a' | 'org-b'>('org-a');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [modalFeedback, setModalFeedback] = useState<{
    type: 'success' | 'error';
    title: string;
    message: string;
  } | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Fetch missions for the active organization
  const fetchMissions = async (orgId: string) => {
    setLoading(true);
    setGeneralError(null);
    try {
      const response = await fetch(`${API_URL}/missions`, {
        method: 'GET',
        headers: {
          'x-org-id': orgId,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch missions');
      }

      const data = await response.json();
      setMissions(data);
    } catch (error: any) {
      console.warn(error);
      setGeneralError(error.message || 'Failed to connect to backend server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMissions(activeOrg);
  }, [activeOrg]);

  // Open detail view and set initial header value
  const handleOpenDetail = (mission: Mission) => {
    setSelectedMission(mission);
    setSubmitHeaderOrg(activeOrg);
    setModalFeedback(null);
  };

  // Close detail modal and reset state
  const handleCloseModal = () => {
    setSelectedMission(null);
    setModalFeedback(null);
  };

  // Submit mission to backend
  const handleSubmitMission = async () => {
    if (!selectedMission) return;
    setSubmitting(true);
    setModalFeedback(null);
    try {
      const response = await fetch(`${API_URL}/missions/${selectedMission.id}/submit`, {
        method: 'POST',
        headers: {
          'x-org-id': submitHeaderOrg,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || response.statusText || 'Failed to submit mission');
      }

      const updatedMission = await response.json();

      // Update local state to reflect updated status
      setMissions((prevMissions) =>
        prevMissions.map((m) => (m.id === updatedMission.id ? updatedMission : m))
      );
      setSelectedMission(updatedMission);

      setModalFeedback({
        type: 'success',
        title: 'Success',
        message: 'Mission submitted successfully!',
      });
    } catch (error: any) {
      console.warn(error);
      setModalFeedback({
        type: 'error',
        title: 'Submission Refused',
        message: error.message || 'Network request failed',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderMissionItem = ({ item }: { item: Mission }) => (
    <Pressable style={styles.card} onPress={() => handleOpenDetail(item)}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.title}</Text>
      </View>
      <View style={styles.cardFooter}>
        <Text style={[styles.statusText, item.status === 'SUBMITTED' ? styles.statusSubmitted : styles.statusAvailable]}>
          ● {item.status}
        </Text>
        <Text style={styles.pointsText}>{item.points} pts</Text>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Title */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Missions</Text>
      </View>

      {/* General Error Banner */}
      {generalError && (
        <View style={styles.generalErrorBanner}>
          <Text style={styles.generalErrorText}>⚠️ {generalError}</Text>
        </View>
      )}

      {/* Organization Switcher */}
      <View style={styles.orgSwitcher}>
        <Pressable
          style={[styles.orgButton, activeOrg === 'org-a' ? styles.orgButtonActive : null]}
          onPress={() => setActiveOrg('org-a')}
        >
          <Text style={[styles.orgButtonText, activeOrg === 'org-a' ? styles.orgButtonTextActive : null]}>
            Organization A
          </Text>
        </Pressable>
        <Pressable
          style={[styles.orgButton, activeOrg === 'org-b' ? styles.orgButtonActive : null]}
          onPress={() => setActiveOrg('org-b')}
        >
          <Text style={[styles.orgButtonText, activeOrg === 'org-b' ? styles.orgButtonTextActive : null]}>
            Organization B
          </Text>
        </Pressable>
      </View>

      {/* Missions List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={missions}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderMissionItem}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No missions found for this organization.</Text>
            </View>
          }
        />
      )}

      {/* Detail view Modal */}
      {selectedMission && (
        <Modal
          visible={true}
          transparent={true}
          animationType="slide"
          onRequestClose={handleCloseModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Mission Details</Text>
                <Pressable onPress={handleCloseModal} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </Pressable>
              </View>

              {/* Mission Content */}
              <View style={styles.modalBody}>
                <Text style={styles.detailLabel}>Title</Text>
                <Text style={styles.detailValue}>{selectedMission.title}</Text>

                <Text style={styles.detailLabel}>Points</Text>
                <Text style={styles.detailValue}>{selectedMission.points} points</Text>

                <Text style={styles.detailLabel}>Status</Text>
                <Text
                  style={[
                    styles.detailValue,
                    selectedMission.status === 'SUBMITTED' ? styles.statusSubmitted : styles.statusAvailable,
                  ]}
                >
                  ● {selectedMission.status}
                </Text>

                {modalFeedback && (
                  <View
                    style={[
                      styles.feedbackBanner,
                      modalFeedback.type === 'success'
                        ? styles.feedbackSuccess
                        : styles.feedbackError,
                    ]}
                  >
                    <Text
                      style={[
                        styles.feedbackTitle,
                        modalFeedback.type === 'success'
                          ? styles.feedbackTitleSuccess
                          : styles.feedbackTitleError,
                      ]}
                    >
                      {modalFeedback.title}
                    </Text>
                    <Text
                      style={[
                        styles.feedbackMessage,
                        modalFeedback.type === 'success'
                          ? styles.feedbackMessageSuccess
                          : styles.feedbackMessageError,
                      ]}
                    >
                      {modalFeedback.message}
                    </Text>
                  </View>
                )}

                <View style={styles.divider} />

                {/* Tenant Isolation Testing Section */}
                <Text style={styles.testHeader}>Tenant Isolation Verification</Text>
                <Text style={styles.testDescription}>
                  Change the request header below to test if the backend rejects unauthorized submissions.
                </Text>

                <View style={styles.headerSelectorContainer}>
                  <Text style={styles.headerLabel}>Request Header (x-org-id):</Text>
                  <View style={styles.headerOrgSwitcher}>
                    <Pressable
                      style={[
                        styles.headerOrgBtn,
                        submitHeaderOrg === 'org-a' ? styles.headerOrgBtnActive : null,
                      ]}
                      onPress={() => setSubmitHeaderOrg('org-a')}
                    >
                      <Text style={submitHeaderOrg === 'org-a' ? styles.headerOrgBtnTextActive : styles.headerOrgBtnText}>
                        org-a
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[
                        styles.headerOrgBtn,
                        submitHeaderOrg === 'org-b' ? styles.headerOrgBtnActive : null,
                      ]}
                      onPress={() => setSubmitHeaderOrg('org-b')}
                    >
                      <Text style={submitHeaderOrg === 'org-b' ? styles.headerOrgBtnTextActive : styles.headerOrgBtnText}>
                        org-b
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>

              {/* Modal Footer (Action Buttons) */}
              <View style={styles.modalFooter}>
                {submitting ? (
                  <ActivityIndicator size="small" color="#007AFF" />
                ) : (
                  <Pressable
                    style={[
                      styles.submitButton,
                      selectedMission.status === 'SUBMITTED' ? styles.submitButtonDisabled : null,
                    ]}
                    onPress={handleSubmitMission}
                    disabled={selectedMission.status === 'SUBMITTED'}
                  >
                    <Text style={styles.submitButtonText}>
                      {selectedMission.status === 'SUBMITTED' ? 'Submitted' : 'Submit Mission'}
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  orgSwitcher: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    gap: 10,
  },
  orgButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
  },
  orgButtonActive: {
    backgroundColor: '#007AFF',
  },
  orgButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3A3A3C',
  },
  orgButtonTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    padding: 15,
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C1C1E',
    flex: 1,
  },
  badge: {
    backgroundColor: '#E5F1FF',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
  },
  cardFooter: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  statusAvailable: {
    color: '#34C759',
  },
  statusSubmitted: {
    color: '#8E8E93',
  },
  pointsText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#8E8E93',
  },
  modalBody: {
    gap: 12,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 16,
    color: '#1C1C1E',
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: 10,
  },
  testHeader: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginBottom: 4,
  },
  testDescription: {
    fontSize: 12,
    color: '#8E8E93',
    lineHeight: 16,
    marginBottom: 10,
  },
  headerSelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF2F2',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFD2D2',
  },
  headerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3A3A3C',
  },
  headerOrgSwitcher: {
    flexDirection: 'row',
    gap: 6,
  },
  headerOrgBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: '#E5E5EA',
  },
  headerOrgBtnActive: {
    backgroundColor: '#FF3B30',
  },
  headerOrgBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3A3A3C',
  },
  headerOrgBtnTextActive: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalFooter: {
    marginTop: 25,
    alignItems: 'stretch',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#D1D1D6',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  generalErrorBanner: {
    backgroundColor: '#FFF2F2',
    borderColor: '#FFD2D2',
    borderWidth: 1,
    padding: 12,
    marginHorizontal: 15,
    marginTop: 10,
    borderRadius: 8,
  },
  generalErrorText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '500',
  },
  feedbackBanner: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginVertical: 10,
  },
  feedbackSuccess: {
    backgroundColor: '#E8F5E9',
    borderColor: '#A5D6A7',
  },
  feedbackError: {
    backgroundColor: '#FFEBEE',
    borderColor: '#EF9A9A',
  },
  feedbackTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  feedbackTitleSuccess: {
    color: '#2E7D32',
  },
  feedbackTitleError: {
    color: '#C62828',
  },
  feedbackMessage: {
    fontSize: 13,
    lineHeight: 18,
  },
  feedbackMessageSuccess: {
    color: '#1B5E20',
  },
  feedbackMessageError: {
    color: '#B71C1C',
  },
});

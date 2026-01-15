import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Menu, Bell } from 'lucide-react-native';
import NotifMenu from './NotifMenu';

export default function CustomHeader({ title, onOpenMenu, unreadCount, notificaciones, clientId, onRefreshNotifs }: any) {
  const [isNotifVisible, setIsNotifVisible] = useState(false);

  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onOpenMenu}>
        <Menu color="#fff" size={28} />
      </TouchableOpacity>
      
      <Text style={styles.headerTitle}>{title}</Text>
      
      <TouchableOpacity onPress={() => setIsNotifVisible(true)}>
        <View>
          <Bell color="#fff" size={26} />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      <NotifMenu 
        visible={isNotifVisible} 
        onClose={() => setIsNotifVisible(false)}
        clientId={clientId}
        unreadCount={unreadCount}
        notificaciones={notificaciones}
        onRefresh={onRefreshNotifs}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    backgroundColor: '#2f3640', 
    paddingTop: Platform.OS === 'ios' ? 50 : 40, 
    paddingBottom: 15 
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#ff7e5f', letterSpacing: 1 },
  badge: { position: 'absolute', right: -5, top: -5, backgroundColor: '#ff4757', borderRadius: 10, width: 18, height: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#2f3640' },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
});
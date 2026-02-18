import { ThemedText } from '@/components/ui/Text';
import { useTheme } from '@/context/ThemeContext';
import React from 'react';
import { StyleSheet, View } from 'react-native';

type RuleCardProps = {
    icon: React.ReactNode;
    title: string;
    desc: string;
    visual: React.ReactNode;
};

const RuleCard = ({ icon, title, desc, visual }: RuleCardProps) => {
    const { colors } = useTheme();
    return (
        <View style={[styles.ruleCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.ruleTextContent}>
                <View style={styles.ruleHeader}>
                    <View style={styles.ruleIcon}>{icon}</View>
                    <ThemedText type="defaultSemiBold" style={[styles.ruleTitle, { color: colors.text }]}>{title}</ThemedText>
                </View>
                <ThemedText style={[styles.ruleDesc, { color: colors.subtext }]}>{desc}</ThemedText>
            </View>
            <View style={[styles.ruleVisual, { borderColor: colors.border }]}>
                 {visual}
            </View>
        </View>
    );
};

export default RuleCard;

const styles = StyleSheet.create({
    ruleCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: 16,
    },
    ruleTextContent: {
        flex: 1,
        marginRight: 16,
    },
    ruleHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    ruleIcon: {
        marginRight: 12,
    },
    ruleTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    ruleDesc: {
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '500',
    },
    ruleVisual: {
        width: 80,
        height: 80,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
    },
});

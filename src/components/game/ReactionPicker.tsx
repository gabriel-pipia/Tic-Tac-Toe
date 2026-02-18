import BottomSheet from '@/components/ui/BottomSheet';
import SheetHeader from '@/components/ui/SheetHeader';
import { ThemedText } from '@/components/ui/Text';
import { useTheme } from '@/context/ThemeContext';
import { Smile } from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import Button from '../ui/Button';
import { ThemedView } from '../ui/View';

const EMOJIS = ["👍", "😂", "👋", "❤️", "🙏", "😮", "😢", "😡"];

interface ReactionPickerProps {
    onSelect: (emoji: string) => void;
    disabled?: boolean;
}

export default function ReactionPicker({ onSelect, disabled }: ReactionPickerProps) {
    const { colors } = useTheme();
    const [isOpen, setIsOpen] = useState(false);

    const handleSelect = (emoji: string) => {
        onSelect(emoji);
        setIsOpen(false);
    };

    return (
        <>
            <Button 
                onPress={() => setIsOpen(true)} 
                disabled={disabled}
                variant='secondary'
                size='md'
                type='icon'
                icon={<Smile size={28} color={colors.text} />}
            />

            <BottomSheet visible={isOpen} onClose={() => setIsOpen(false)}>
                    <SheetHeader title="Send a Reaction" onClose={() => setIsOpen(false)} />
                    
                    <ThemedView style={styles.emojiGrid}>
                        {EMOJIS.map((emoji) => (
                            <Button 
                                key={emoji} 
                                size='sm'
                                type='icon'
                                variant='secondary'
                                style={[styles.emojiButton]} 
                                onPress={() => handleSelect(emoji)}
                                icon={<ThemedText style={{ fontSize: 30,  overflow: 'visible', lineHeight: 50, textAlign: 'center' }}>{emoji}</ThemedText>}
                            />
                        ))}
                    </ThemedView>
            </BottomSheet>
        </>
    );
}

const styles = StyleSheet.create({
    triggerButton: {
        width: 52,
        height: 52,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    emojiGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        justifyContent: 'space-between',
        padding: 24,
    },
    emojiButton: {
        width: '20%',
        aspectRatio: 1/1,
        overflow: 'visible',
    }
});

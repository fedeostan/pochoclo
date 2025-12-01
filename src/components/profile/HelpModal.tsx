/**
 * HelpModal Component
 *
 * A full-screen modal displaying Help & FAQ content.
 * Uses an accordion pattern to organize FAQs into scannable, expandable sections.
 *
 * DESIGN PRINCIPLES:
 * - Scannable: All questions visible at a glance
 * - Progressive disclosure: Answers revealed on demand
 * - Organized: Grouped by topic
 */

import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { View, ScrollView } from 'react-native';
import * as Linking from 'expo-linking';
import { Mail } from 'lucide-react-native';
import { Text, Button, Card } from '@/components/ui';
import { FullScreenModal } from '@/components/ui/FullScreenModal';
import type { FullScreenModalRef } from '@/components/ui/FullScreenModal';
import { FAQItem } from '@/components/help';
import { colors } from '@/theme';

// FAQ Data
interface FAQQuestion {
  question: string;
  answer: string;
}

interface FAQSection {
  title: string;
  questions: FAQQuestion[];
}

const FAQ_DATA: FAQSection[] = [
  {
    title: 'Getting Started',
    questions: [
      {
        question: 'How does POCHOCLO work?',
        answer:
          'POCHOCLO delivers bite-sized learning content tailored to your interests. Each day, you\'ll get fresh content in categories you\'ve chosen - perfect for learning in small moments throughout your day. Just swipe through cards to discover new topics and save what interests you most.',
      },
      {
        question: 'How do I change my learning topics?',
        answer:
          'Go to your Profile (bottom right tab) and tap "Learning Preferences". You can select new categories that interest you and adjust how much time you want to spend learning each day. Your content feed will update to reflect your new preferences.',
      },
      {
        question: 'What\'s the best time to learn?',
        answer:
          'That\'s entirely up to you! Many users prefer morning routines or lunch breaks. We recommend enabling daily reminders in Profile > Notifications to build a consistent learning habit. Even just 5-10 minutes a day can lead to meaningful knowledge gains over time.',
      },
    ],
  },
  {
    title: 'Content & Learning',
    questions: [
      {
        question: 'How is content selected for me?',
        answer:
          'We curate content based on the categories you selected during setup. The more you interact with content (save, read, swipe), the better we understand what interests you. Our goal is to provide relevant, high-quality content that matches your learning goals.',
      },
      {
        question: 'Can I save content for later?',
        answer:
          'Yes! Tap the bookmark icon on any content card to save it. You can access your saved items anytime from Profile > Saved Content. This is great for content you want to revisit or share with others.',
      },
      {
        question: 'How long is each piece of content?',
        answer:
          'Most content is designed to be read in 2-5 minutes - perfect for quick learning sessions. When you set your daily learning time preference, we\'ll suggest the right amount of content to fill that time without overwhelming you.',
      },
    ],
  },
  {
    title: 'Account & Settings',
    questions: [
      {
        question: 'How do I change my notification time?',
        answer:
          'Go to Profile > Notifications and make sure Daily Reminder is enabled. Then tap "Reminder Time" to choose when you\'d like to receive your daily learning reminder. You can set it to match your most productive learning time.',
      },
      {
        question: 'Can I change my email address?',
        answer:
          'Yes, go to Profile > Account > Change Email. You\'ll need to verify your current password and then confirm your new email address. The change takes effect once you verify the new email.',
      },
      {
        question: 'How do I delete my account?',
        answer:
          'We\'re sorry to see you go! To delete your account, please contact us at support@pochoclo.app. Include the email address associated with your account. We\'ll process your request within 30 days and confirm once complete.',
      },
    ],
  },
];

interface HelpModalProps {
  onDismiss?: () => void;
}

export interface HelpModalRef {
  present: () => void;
  dismiss: () => void;
}

export const HelpModal = forwardRef<HelpModalRef, HelpModalProps>(
  function HelpModal({ onDismiss }, ref) {
    const modalRef = useRef<FullScreenModalRef>(null);

    useImperativeHandle(ref, () => ({
      present: () => modalRef.current?.present(),
      dismiss: () => modalRef.current?.dismiss(),
    }));

    const handleDismiss = () => {
      onDismiss?.();
    };

    const handleContactSupport = async () => {
      const email = 'support@pochoclo.app';
      const subject = encodeURIComponent('POCHOCLO Support Request');
      const mailtoUrl = `mailto:${email}?subject=${subject}`;

      try {
        const canOpen = await Linking.canOpenURL(mailtoUrl);
        if (canOpen) {
          await Linking.openURL(mailtoUrl);
        }
      } catch (error) {
        console.error('[Help] Error opening email:', error);
      }
    };

    return (
      <FullScreenModal
        ref={modalRef}
        title="Help & FAQ"
        onDismiss={handleDismiss}
        scrollable={false}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Welcome Header */}
          <View className="items-center mb-6">
            <Text variant="h2" className="text-center mb-2">
              We're here to help
            </Text>
            <Text variant="muted" className="text-center">
              Find answers to common questions below
            </Text>
          </View>

          {/* FAQ Sections */}
          {FAQ_DATA.map((section) => (
            <View key={section.title} className="mb-6">
              <Text
                variant="small"
                className="text-muted-foreground uppercase tracking-wide px-4 mb-2"
              >
                {section.title}
              </Text>

              <Card className="overflow-hidden">
                {section.questions.map((faq, questionIndex) => (
                  <FAQItem
                    key={faq.question}
                    question={faq.question}
                    answer={faq.answer}
                    isLast={questionIndex === section.questions.length - 1}
                  />
                ))}
              </Card>
            </View>
          ))}

          {/* Contact Support */}
          <Card className="p-4 mt-2 mb-6">
            <View className="items-center">
              <Text variant="body" className="text-center mb-3">
                Still need help?
              </Text>
              <Button
                variant="secondary"
                onPress={handleContactSupport}
                leftIcon={<Mail size={18} color={colors.primary} />}
              >
                <Text className="text-primary font-medium">Contact Support</Text>
              </Button>
            </View>
          </Card>
        </ScrollView>
      </FullScreenModal>
    );
  }
);

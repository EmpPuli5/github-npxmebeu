import { useContext, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths, parse, set } from 'date-fns';
import { ChevronLeft, ChevronRight, Clock, CircleCheck as CheckCircle, Circle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AppContext } from '@/contexts/AppContext';
import { COLORS } from '@/constants/theme';
import GoalItem from '@/components/GoalItem';
import { Goal } from '@/types';
import { getCompletionColorForProgress } from '@/utils/helpers';

// Generate time slots for every 30 minutes from 6 AM to 10 PM
const TIME_SLOTS = Array.from({ length: 32 }, (_, i) => {
  const hour = Math.floor(i / 2) + 6;
  const minutes = (i % 2) * 30;
  return { hour, minutes };
});

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { dailyPlans, updateGoalSchedule } = useContext(AppContext);
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ hour: number; minutes: number } | null>(null);
  
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  
  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  
  // Get the goals for selected date
  const selectedDayPlan = dailyPlans.find(plan => 
    isSameDay(new Date(plan.date), selectedDate)
  );
  
  const getDateColor = (date: Date) => {
    const dayPlan = dailyPlans.find(plan => isSameDay(new Date(plan.date), date));
    
    if (!dayPlan) return 'transparent';
    
    return getCompletionColorForProgress(dayPlan.progress);
  };

  const handleScheduleGoal = (goal: Goal, slot: { hour: number; minutes: number }) => {
    setSelectedGoal(goal);
    setSelectedTimeSlot(slot);
    setShowScheduleModal(true);
  };

  const confirmSchedule = (duration: number) => {
    if (!selectedGoal || !selectedTimeSlot) return;

    const startTime = set(selectedDate, { 
      hours: selectedTimeSlot.hour, 
      minutes: selectedTimeSlot.minutes 
    });
    
    const endTime = new Date(startTime);
    endTime.setMinutes(startTime.getMinutes() + duration * 60);

    updateGoalSchedule(selectedGoal.id, {
      start: startTime.toISOString(),
      end: endTime.toISOString(),
    });

    setShowScheduleModal(false);
    setSelectedGoal(null);
    setSelectedTimeSlot(null);
  };

  const getScheduledGoalsForTimeSlot = (slot: { hour: number; minutes: number }) => {
    if (!selectedDayPlan?.goals) return [];
    
    return selectedDayPlan.goals.filter(goal => {
      if (!goal.scheduledTime) return false;
      
      const startTime = new Date(goal.scheduledTime.start);
      const endTime = new Date(goal.scheduledTime.end);
      const slotTime = set(selectedDate, { 
        hours: slot.hour, 
        minutes: slot.minutes 
      });
      
      return slotTime >= startTime && slotTime < endTime;
    });
  };

  const formatTimeSlot = (slot: { hour: number; minutes: number }) => {
    return format(
      set(new Date(), { hours: slot.hour, minutes: slot.minutes }), 
      'h:mm'
    );
  };

  // Create schedule blocks for better visualization
  const createScheduleBlocks = () => {
    const blocks = [];
    const scheduledGoals = selectedDayPlan?.goals.filter(goal => goal.scheduledTime) || [];
    
    // Sort goals by start time
    const sortedGoals = scheduledGoals.sort((a, b) => {
      const timeA = new Date(a.scheduledTime!.start);
      const timeB = new Date(b.scheduledTime!.start);
      return timeA.getTime() - timeB.getTime();
    });

    for (const goal of sortedGoals) {
      const startTime = new Date(goal.scheduledTime!.start);
      const endTime = new Date(goal.scheduledTime!.end);
      
      blocks.push({
        goal,
        startTime: format(startTime, 'h:mm'),
        endTime: format(endTime, 'h:mm'),
        duration: Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)),
        completed: goal.completed,
      });
    }

    return blocks;
  };

  const scheduleBlocks = createScheduleBlocks();
  const unscheduledGoals = selectedDayPlan?.goals.filter(goal => !goal.scheduledTime) || [];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Calendar</Text>
        <Text style={styles.subtitle}>Track your daily progress</Text>
      </View>
      
      <View style={styles.calendarHeader}>
        <TouchableOpacity onPress={goToPreviousMonth}>
          <ChevronLeft size={24} color={COLORS.neutral[600]} />
        </TouchableOpacity>
        <Text style={styles.monthTitle}>{format(currentMonth, 'MMMM yyyy')}</Text>
        <TouchableOpacity onPress={goToNextMonth}>
          <ChevronRight size={24} color={COLORS.neutral[600]} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.daysOfWeek}>
        {weekdays.map(day => (
          <Text key={day} style={styles.dayOfWeek}>
            {day}
          </Text>
        ))}
      </View>
      
      <View style={styles.calendar}>
        {monthDays.map((day, i) => {
          const dateColor = getDateColor(day);
          const isSelected = isSameDay(day, selectedDate);
          
          return (
            <TouchableOpacity
              key={day.toString()}
              style={[
                styles.calendarDay,
                isToday(day) && styles.today,
                isSelected && styles.selectedDay,
              ]}
              onPress={() => setSelectedDate(day)}
            >
              <View
                style={[
                  styles.dateCircle,
                  dateColor !== 'transparent' && { backgroundColor: dateColor },
                  isSelected && styles.selectedDateCircle,
                ]}
              >
                <Text
                  style={[
                    styles.calendarDayText,
                    !isSameMonth(day, currentMonth) && styles.outsideMonthText,
                    isToday(day) && styles.todayText,
                    isSelected && styles.selectedDayText,
                  ]}
                >
                  {format(day, 'd')}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
      
      <View style={styles.selectedDateContainer}>
        <View style={styles.scheduleHeader}>
          <Text style={styles.selectedDateTitle}>
            {isToday(selectedDate) ? 'Today' : format(selectedDate, 'EEEE, MMMM d')}
          </Text>
          <Text style={styles.scheduleSubtitle}>Daily Schedule</Text>
        </View>
        
        <ScrollView
          style={styles.scheduleScrollView}
          contentContainerStyle={styles.scheduleContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Scheduled Goals - Clean Block Format */}
          {scheduleBlocks.length > 0 && (
            <View style={styles.scheduledSection}>
              <Text style={styles.sectionTitle}>Scheduled Activities</Text>
              
              {scheduleBlocks.map((block, index) => (
                <Animated.View 
                  key={block.goal.id}
                  entering={FadeInDown.delay(index * 100).springify()}
                  style={[
                    styles.scheduleBlock,
                    block.completed && styles.completedBlock
                  ]}
                >
                  <View style={styles.timeColumn}>
                    <Text style={styles.startTime}>{block.startTime}</Text>
                    <View style={styles.timeDivider} />
                    <Text style={styles.endTime}>{block.endTime}</Text>
                  </View>
                  
                  <View style={styles.activityColumn}>
                    <View style={styles.activityHeader}>
                      <Text style={[
                        styles.activityTitle,
                        block.completed && styles.completedText
                      ]}>
                        {block.goal.title}
                      </Text>
                      <View style={styles.statusIcon}>
                        {block.completed ? (
                          <CheckCircle size={20} color={COLORS.success[600]} />
                        ) : (
                          <Circle size={20} color={COLORS.neutral[400]} />
                        )}
                      </View>
                    </View>
                    
                    {block.goal.description && (
                      <Text style={[
                        styles.activityDescription,
                        block.completed && styles.completedText
                      ]}>
                        {block.goal.description}
                      </Text>
                    )}
                    
                    <Text style={styles.duration}>
                      {block.duration} minutes
                    </Text>
                  </View>
                </Animated.View>
              ))}
            </View>
          )}

          {/* Unscheduled Goals */}
          {unscheduledGoals.length > 0 && (
            <View style={styles.unscheduledSection}>
              <Text style={styles.sectionTitle}>
                Unscheduled Goals ({unscheduledGoals.length})
              </Text>
              
              <View style={styles.unscheduledList}>
                {unscheduledGoals.map((goal, index) => (
                  <Animated.View 
                    key={goal.id}
                    entering={FadeInDown.delay((scheduleBlocks.length + index) * 100).springify()}
                    style={styles.unscheduledItem}
                  >
                    <View style={styles.unscheduledContent}>
                      <View style={styles.unscheduledHeader}>
                        <Text style={[
                          styles.unscheduledTitle,
                          goal.completed && styles.completedText
                        ]}>
                          {goal.title}
                        </Text>
                        <View style={styles.statusIcon}>
                          {goal.completed ? (
                            <CheckCircle size={18} color={COLORS.success[600]} />
                          ) : (
                            <Circle size={18} color={COLORS.neutral[400]} />
                          )}
                        </View>
                      </View>
                      
                      {goal.description && (
                        <Text style={[
                          styles.unscheduledDescription,
                          goal.completed && styles.completedText
                        ]}>
                          {goal.description}
                        </Text>
                      )}
                    </View>
                  </Animated.View>
                ))}
              </View>
            </View>
          )}

          {/* Empty State */}
          {scheduleBlocks.length === 0 && unscheduledGoals.length === 0 && (
            <View style={styles.emptyState}>
              <Clock size={48} color={COLORS.neutral[400]} />
              <Text style={styles.emptyStateText}>No goals for this day</Text>
              <Text style={styles.emptyStateSubtext}>
                Add goals to your library and schedule them for better planning
              </Text>
            </View>
          )}
        </ScrollView>
      </View>

      <Modal
        visible={showScheduleModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowScheduleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Duration</Text>
            <Text style={styles.modalSubtitle}>
              How long will "{selectedGoal?.title}" take?
            </Text>

            <View style={styles.durationButtons}>
              {[0.5, 1, 1.5, 2, 2.5, 3].map(duration => (
                <TouchableOpacity
                  key={duration}
                  style={styles.durationButton}
                  onPress={() => confirmSchedule(duration)}
                >
                  <Text style={styles.durationButtonText}>
                    {duration} {duration === 1 ? 'hour' : 'hours'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowScheduleModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: COLORS.neutral[900],
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: COLORS.neutral[500],
    marginTop: 4,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
  },
  monthTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: COLORS.neutral[800],
  },
  daysOfWeek: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  dayOfWeek: {
    width: 36,
    textAlign: 'center',
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: COLORS.neutral[500],
  },
  calendar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
  },
  calendarDay: {
    width: '14.28%',
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarDayText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: COLORS.neutral[800],
  },
  outsideMonthText: {
    color: COLORS.neutral[400],
  },
  today: {
    // Handled by dateCircle and todayText
  },
  todayText: {
    fontFamily: 'Inter-SemiBold',
  },
  selectedDay: {
    // Handled by selectedDateCircle
  },
  selectedDateCircle: {
    borderWidth: 2,
    borderColor: COLORS.primary[600],
  },
  selectedDayText: {
    fontFamily: 'Inter-SemiBold',
  },
  selectedDateContainer: {
    flex: 1,
    backgroundColor: COLORS.neutral[50],
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  scheduleHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral[200],
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  selectedDateTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: COLORS.neutral[900],
  },
  scheduleSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: COLORS.neutral[500],
    marginTop: 4,
  },
  scheduleScrollView: {
    flex: 1,
  },
  scheduleContent: {
    paddingBottom: 24,
  },
  scheduledSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: COLORS.neutral[800],
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scheduleBlock: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: COLORS.neutral[900],
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary[500],
  },
  completedBlock: {
    borderLeftColor: COLORS.success[500],
    opacity: 0.8,
  },
  timeColumn: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: COLORS.neutral[50],
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  startTime: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: COLORS.neutral[800],
  },
  timeDivider: {
    width: 20,
    height: 1,
    backgroundColor: COLORS.neutral[300],
    marginVertical: 4,
  },
  endTime: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: COLORS.neutral[600],
  },
  activityColumn: {
    flex: 1,
    padding: 16,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  activityTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: COLORS.neutral[900],
    flex: 1,
    marginRight: 8,
  },
  activityDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: COLORS.neutral[600],
    marginBottom: 8,
    lineHeight: 20,
  },
  duration: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: COLORS.primary[600],
    backgroundColor: COLORS.primary[50],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  statusIcon: {
    marginLeft: 8,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: COLORS.neutral[500],
  },
  unscheduledSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  unscheduledList: {
    gap: 8,
  },
  unscheduledItem: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    shadowColor: COLORS.neutral[900],
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  unscheduledContent: {
    padding: 16,
  },
  unscheduledHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  unscheduledTitle: {
    fontSize: 15,
    fontFamily: 'Inter-Medium',
    color: COLORS.neutral[800],
    flex: 1,
    marginRight: 8,
  },
  unscheduledDescription: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: COLORS.neutral[600],
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: COLORS.neutral[600],
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: COLORS.neutral[500],
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: COLORS.neutral[900],
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: COLORS.neutral[600],
    marginBottom: 24,
  },
  durationButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  durationButton: {
    width: '48%',
    backgroundColor: COLORS.primary[100],
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  durationButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: COLORS.primary[700],
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: COLORS.neutral[600],
  },
});
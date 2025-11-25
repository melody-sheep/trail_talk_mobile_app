import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Image,
  Animated,
  Dimensions,
  PanResponder,
  Easing,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles/colors';
import { fonts } from '../../styles/fonts';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const CARD_WIDTH = screenWidth * 0.78;
const COLLAPSED_HEIGHT = 320;
const EXPANDED_HEIGHT = 520;
const SPACING = 16;

// FIXED: Export the team members array with FULL NAMES
export const studentTeamMembers = [
  {
    id: 1,
    name: 'Alther Adrian P. Liga',
    role: 'Lead Developer',
    description: 'Responsible for full-stack development and system architecture. Alther designed the core infrastructure and implemented the real-time features that make TrailTalk responsive and reliable.',
    skills: ['React Native', 'Node.js', 'PostgreSQL', 'Supabase', 'System Design'],
    image: require('../../../assets/developer_profiles/alther.png'),
    gender: 'male'
  },
  {
    id: 2,
    name: 'Jocelyn D. Caballero',
    role: 'UI/UX Designer',
    description: 'Crafted the beautiful user interface and seamless user experience. Jocelyn ensured the app is both functional and visually appealing while maintaining intuitive navigation patterns.',
    skills: ['Figma', 'UI Design', 'UX Research', 'Prototyping', 'User Testing'],
    image: require('../../../assets/developer_profiles/celine.png'),
    gender: 'female'
  },
  {
    id: 3,
    name: 'Divine Tapayan',
    role: 'Backend Developer',
    description: 'Built the robust backend infrastructure and database design. Divine implemented the complex business logic, API integrations, and ensured data security throughout the system.',
    skills: ['Node.js', 'PostgreSQL', 'REST APIs', 'Authentication', 'Database Design'],
    image: require('../../../assets/developer_profiles/divine.png'),
    gender: 'female'
  },
  {
    id: 4,
    name: 'Faisal Inidal',
    role: 'Mobile Developer',
    description: 'Specialized in React Native development and cross-platform compatibility. Faisal brought the designs to life with smooth animations and optimized performance for both iOS and Android.',
    skills: ['React Native', 'JavaScript', 'Mobile Development', 'Animation', 'Performance'],
    image: require('../../../assets/developer_profiles/faisal.png'),
    gender: 'male'
  },
  {
    id: 5,
    name: 'Harry Fernandez',
    role: 'Project Manager',
    description: 'Coordinated the development process and ensured timely delivery. Harry maintained quality standards, facilitated team communication, and managed project timelines effectively.',
    skills: ['Project Management', 'Agile', 'Quality Assurance', 'Documentation', 'Team Leadership'],
    image: require('../../../assets/developer_profiles/harry.png'),
    gender: 'male'
  }
];

const StudentDevelopersScreen = ({ navigation }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const [selectedCard, setSelectedCard] = useState(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const carouselRef = useRef(null);
  const autoScrollTimer = useRef(null);
  const pauseTimeout = useRef(null);
  const selectedCardRef = useRef(selectedCard);
  const nameOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => { selectedCardRef.current = selectedCard; }, [selectedCard]);

  // FIXED: Use the exported studentTeamMembers
  const teamMembers = studentTeamMembers;

  const cardHeights = useRef(teamMembers.map(() => new Animated.Value(COLLAPSED_HEIGHT))).current;
  const borderColors = useRef(teamMembers.map(() => new Animated.Value(0))).current;

  const getDeveloperColors = (gender) => {
    return gender === 'female' 
      ? {
          primary: '#FF2D78',
          bgColor: 'rgba(255, 45, 120, 0.15)',
          borderColor: 'rgba(255, 45, 120, 0.4)',
          glowColor: 'rgba(255, 45, 120, 0.3)',
          dotColor: '#FF2D78',
          expertiseBg: '#8A1F4D',
          expertiseBorder: '#FF2D78'
        }
      : {
          primary: '#00E5FF',
          bgColor: 'rgba(0, 229, 255, 0.15)',
          borderColor: 'rgba(0, 229, 255, 0.4)',
          glowColor: 'rgba(0, 229, 255, 0.3)',
          dotColor: '#00E5FF',
          expertiseBg: '#006B7A',
          expertiseBorder: '#00E5FF'
        };
  };

  // Auto-scroll functionality
  useEffect(() => {
    if (isAutoScroll && selectedCard === null) {
      autoScrollTimer.current = setInterval(() => {
        Animated.timing(nameOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          setActiveIndex(prev => (prev + 1) % teamMembers.length);
          Animated.timing(nameOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }).start();
        });
      }, 3000);
    }

    return () => {
      if (autoScrollTimer.current) {
        clearInterval(autoScrollTimer.current);
        autoScrollTimer.current = null;
      }
      if (pauseTimeout.current) {
        clearTimeout(pauseTimeout.current);
        pauseTimeout.current = null;
      }
    };
  }, [isAutoScroll, selectedCard, teamMembers.length]);

  // Pause auto-scroll and schedule resume after `ms` milliseconds.
  const pauseAutoScrollFor = (ms = 2000) => {
    if (autoScrollTimer.current) {
      clearInterval(autoScrollTimer.current);
      autoScrollTimer.current = null;
    }
    setIsAutoScroll(false);

    if (pauseTimeout.current) {
      clearTimeout(pauseTimeout.current);
    }

    pauseTimeout.current = setTimeout(() => {
      // only resume if no card is selected
      if (selectedCardRef.current === null) {
        setIsAutoScroll(true);
      }
      pauseTimeout.current = null;
    }, ms);
  };

  // Scroll to active index
  useEffect(() => {
    if (carouselRef.current && selectedCard === null) {
      carouselRef.current.scrollToIndex({
        index: activeIndex,
        animated: true,
        viewPosition: 0.5
      });
    }
  }, [activeIndex, selectedCard]);

  // PanResponder for swipe detection
  const panResponder = useRef(
    PanResponder.create({
      // Only capture the gesture when it is predominantly horizontal.
      // This allows vertical scrolls inside the expanded details ScrollView.
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const { dx, dy } = gestureState;
        return Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 6;
      },
      onPanResponderGrant: () => {
        pauseAutoScrollFor(2000);
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (Math.abs(gestureState.dx) > 50) {
          Animated.timing(nameOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            if (gestureState.dx > 0) {
              setActiveIndex(prev => (prev - 1 + teamMembers.length) % teamMembers.length);
            } else {
              setActiveIndex(prev => (prev + 1) % teamMembers.length);
            }
            Animated.timing(nameOpacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }).start();
          });
        }
        
        // resume auto-scroll after short pause
        pauseAutoScrollFor(2000);
      },
    })
  ).current;

  const handleProfilePress = (index) => {
    if (selectedCard === index) {
      // Collapse card and remove border
      Animated.parallel([
        Animated.timing(cardHeights[index], {
          toValue: COLLAPSED_HEIGHT,
          duration: 400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(borderColors[index], {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        })
      ]).start(() => {
        setSelectedCard(null);
        setIsAutoScroll(true);
      });
    } else {
      // Expand card and add border
      if (selectedCard !== null) {
        // Collapse currently selected card first
        Animated.parallel([
          Animated.timing(cardHeights[selectedCard], {
            toValue: COLLAPSED_HEIGHT,
            duration: 300,
            easing: Easing.out(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(borderColors[selectedCard], {
            toValue: 0,
            duration: 300,
            easing: Easing.out(Easing.ease),
            useNativeDriver: false,
          })
        ]).start(() => {
          setSelectedCard(null);
            setTimeout(() => {
            setSelectedCard(index);
            pauseAutoScrollFor(2000);
            Animated.parallel([
              Animated.timing(cardHeights[index], {
                toValue: EXPANDED_HEIGHT,
                duration: 400,
                easing: Easing.out(Easing.ease),
                useNativeDriver: false,
              }),
              Animated.timing(borderColors[index], {
                toValue: 1,
                duration: 400,
                easing: Easing.out(Easing.ease),
                useNativeDriver: false,
              })
            ]).start();
          }, 50);
        });
      } else {
        setSelectedCard(index);
        pauseAutoScrollFor(2000);
        Animated.parallel([
          Animated.timing(cardHeights[index], {
            toValue: EXPANDED_HEIGHT,
            duration: 400,
            easing: Easing.out(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(borderColors[index], {
            toValue: 1,
            duration: 400,
            easing: Easing.out(Easing.ease),
            useNativeDriver: false,
          })
        ]).start();
      }
    }
  };

  const renderItem = ({ item, index }) => {
    const inputRange = [
      (index - 1) * CARD_WIDTH,
      index * CARD_WIDTH,
      (index + 1) * CARD_WIDTH,
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.85, 1, 0.85],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.6, 1, 0.6],
      extrapolate: 'clamp',
    });

    const isSelected = selectedCard === index;
    const developerColors = getDeveloperColors(item.gender);

    const profileBorderColor = borderColors[index].interpolate({
      inputRange: [0, 1],
      outputRange: ['rgba(255, 255, 255, 0)', developerColors.primary]
    });

    return (
      <Animated.View
        style={[
          styles.card,
          {
            transform: [{ scale }],
            opacity,
            height: cardHeights[index],
          },
        ]}
      >
        <View style={styles.cardContent}>
          {/* Profile Image - Acts as toggle button */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => handleProfilePress(index)}
            style={styles.profileImageContainer}
          >
            <Animated.View style={[
              styles.profileImageWrapper,
              {
                borderColor: profileBorderColor,
                borderWidth: isSelected ? 3 : 0,
              }
            ]}>
              <Image 
                source={item.image} 
                style={styles.developerImage}
                resizeMode="contain"
              />
            </Animated.View>
          </TouchableOpacity>

          {/* Name and role placed below the profile image */}
          <View style={[
            styles.nameRoleInner,
            isSelected && styles.nameRoleInnerSelected
          ]}>
            {/* FIXED: Display FULL NAME */}
            <Text style={[
              styles.developerName,
              isSelected && styles.developerNameSmall
            ]}>{item.name}</Text>
            <Text style={[
              styles.developerRole,
              { color: developerColors.primary },
              isSelected && styles.developerRoleSmall
            ]}>
              {item.role}
            </Text>
          </View>

          {/* Details Container - Expands when profile is pressed */}
          <Animated.View style={[
            styles.detailsContainer,
            {
              height: cardHeights[index].interpolate({
                inputRange: [COLLAPSED_HEIGHT, EXPANDED_HEIGHT],
                outputRange: [0, EXPANDED_HEIGHT - 220]
              }),
              opacity: cardHeights[index].interpolate({
                inputRange: [COLLAPSED_HEIGHT + 50, EXPANDED_HEIGHT],
                outputRange: [0, 1]
              })
            }
          ]}>
            {isSelected && (
              <ScrollView 
                style={styles.detailsScrollView}
                contentContainerStyle={{ paddingBottom: 32 }}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
              >
                <Text style={[styles.developerDescription, { textAlign: 'justify' }]}>
                  {item.description}
                </Text>
                
                <View style={styles.skillsSection}>
                  <View style={[
                    styles.skillsTitleContainer,
                    { 
                      backgroundColor: developerColors.expertiseBg,
                      borderColor: developerColors.expertiseBorder
                    }
                  ]}>
                    <Text style={styles.skillsTitle}>Expertise</Text>
                  </View>
                  <View style={styles.skillsContainer}>
                    {item.skills.map((skill, skillIndex) => (
                      <View 
                        key={skillIndex} 
                        style={[
                          styles.skillChip,
                          { backgroundColor: developerColors.bgColor }
                        ]}
                      >
                        <Text style={[
                          styles.skillText,
                          { color: developerColors.primary }
                        ]}>
                          {skill}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </ScrollView>
            )}
          </Animated.View>
        </View>
      </Animated.View>
    );
  };

  const currentDeveloper = teamMembers[activeIndex];
  const developerColors = getDeveloperColors(currentDeveloper.gender);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.homeBackground} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meet the Team</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Hero Section */}
      <View style={styles.heroSection}>
        <Text style={styles.heroBrand}>OrviBox</Text>
        <Text
          style={styles.heroTitle}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
        >
          Faith + Curiosity + Persistence
        </Text>
      </View>

      {/* Carousel */}
      <View style={styles.carouselContainer} {...panResponder.panHandlers}>
        <Animated.FlatList
          ref={carouselRef}
          data={teamMembers}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_WIDTH + SPACING}
          decelerationRate="fast"
          contentContainerStyle={styles.carouselContent}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
          onMomentumScrollEnd={(event) => {
            const newIndex = Math.round(
              event.nativeEvent.contentOffset.x / (CARD_WIDTH + SPACING)
            );
            if (selectedCard === null) {
              Animated.timing(nameOpacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
              }).start(() => {
                setActiveIndex(newIndex);
                Animated.timing(nameOpacity, {
                  toValue: 1,
                  duration: 200,
                  useNativeDriver: true,
                }).start();
              });
            }
          }}
        />
      </View>

      {/* Pagination Dots - Hidden when card is expanded */}
      {selectedCard === null && (
        <View style={styles.pagination}>
          {teamMembers.map((_, index) => {
            const dotColors = getDeveloperColors(teamMembers[index].gender);
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dot,
                  activeIndex === index && [
                    styles.dotActive,
                    { backgroundColor: dotColors.dotColor }
                  ]
                ]}
                onPress={() => {
                  pauseAutoScrollFor(2000);
                  Animated.timing(nameOpacity, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                  }).start(() => {
                    setActiveIndex(index);
                    Animated.timing(nameOpacity, {
                      toValue: 1,
                      duration: 200,
                      useNativeDriver: true,
                    }).start();
                  });
                }}
              />
            );
          })}
        </View>
      )}

      {/* Footer / Subtitle moved here - hidden when a card is expanded */}
      {selectedCard === null && (
        <View style={styles.instructions}>
          <Text style={styles.instructionsText}>
            The brilliant minds crafting your campus experience
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.homeBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: fonts.semiBold,
    color: colors.white,
  },
  headerRight: {
    width: 32,
  },
  heroSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  heroBrand: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: 12,
  },
  carouselContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  carouselContent: {
    paddingHorizontal: (screenWidth - CARD_WIDTH) / 2,
    alignItems: 'center',
  },
  card: {
    width: CARD_WIDTH,
    marginHorizontal: SPACING / 2,
  },
  cardContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  profileImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  profileImageWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  developerImage: {
    width: CARD_WIDTH - 40,
    height: 220,
  },
  detailsContainer: {
    width: '100%',
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  detailsScrollView: {
    flex: 1,
  },
  developerDescription: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 20,
    marginBottom: 12,
  },
  skillsSection: {
    marginTop: 4,
  },
  skillsTitleContainer: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 6,
    alignSelf: 'flex-start',
  },
  skillsTitle: {
    fontSize: 11,
    fontFamily: fonts.normal,
    color: colors.white,
  },
  nameRoleInner: {
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 10,
  },
  nameRoleInnerSelected: {
    alignItems: 'flex-start',
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 8,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  skillChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  skillText: {
    fontSize: 11,
    fontFamily: fonts.medium,
  },
  developerName: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: colors.white,
    marginBottom: 4,
    textAlign: 'center',
  },
  developerRole: {
    fontSize: 16,
    fontFamily: fonts.medium,
    textAlign: 'center',
  },
  developerNameSmall: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.white,
    marginBottom: 2,
    textAlign: 'left',
  },
  developerRoleSmall: {
    fontSize: 14,
    fontFamily: fonts.normal,
    textAlign: 'left',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dotActive: {
    width: 20,
  },
  instructions: {
    paddingHorizontal: 20,
    paddingBottom: 25,
    alignItems: 'center',
  },
  instructionsText: {
    fontSize: 13,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
});

export default StudentDevelopersScreen;
import AsyncStorage from '@react-native-async-storage/async-storage';

const WELCOME_KEY='jaheez.has_seen_welcome';
export async function hasSeenWelcome(){return (await AsyncStorage.getItem(WELCOME_KEY))==='1'}
export async function markWelcomeSeen(){await AsyncStorage.setItem(WELCOME_KEY,'1')}

import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	ScrollView,
	TouchableOpacity,
	StyleSheet,
	StatusBar,
	RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from "@tanstack/react-query";

import { BouncingDots } from '../../component/LoadingDots';
import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';

import { getCompany } from '../../services/v2/CompanyService';

interface Member {
	id: string;
	name: string;
	email: string;
	role: string;
}

interface MemberCardProps {
	member: Member;
	isSelected: boolean;
	onToggle: (id: string) => void;
}

// Mock data for demo
const DEMO_MEMBERS: Member[] = [
	{
		id: '1',
		name: 'Jean Dupont',
		email: 'jean.dupont@example.com',
		role: 'OPCO-EP'
	},
	{
		id: '2',
		name: 'Marie Martin',
		email: 'marie.martin@example.com',
		role: 'OPCO-EP'
	},
	{
		id: '3',
		name: 'Pierre Leroy',
		email: 'pierre.leroy@example.com',
		role: 'OPCO-EP'
	},
	{
		id: '4',
		name: 'Sophie Bernard',
		email: 'sophie.bernard@example.com',
		role: 'OPCO-EP'
	},
	{
		id: '5',
		name: 'Luc Petit',
		email: 'luc.petit@example.com',
		role: 'OPCO-EP'
	},
	{
		id: '6',
		name: 'Claire Dubois',
		email: 'claire.dubois@example.com',
		role: 'OPCO-EP'
	},
	{
		id: '7',
		name: 'Thomas Moreau',
		email: 'thomas.moreau@example.com',
		role: 'OPCO-EP'
	},
	{
		id: '8',
		name: 'Isabelle Laurent',
		email: 'isabelle.laurent@example.com',
		role: 'OPCO-EP'
	}
];

const MemberCard: React.FC<MemberCardProps> = ({ member, isSelected, onToggle }) => {
	return (
		<TouchableOpacity
			activeOpacity={0.7}
			onPress={() => onToggle(member.id)}
			style={[
				styles.memberCard,
				isSelected && styles.memberCardSelected
			]}
		>
			{/* Avatar Placeholder */}
			<View style={[
				styles.avatarPlaceholder,
				isSelected && styles.avatarPlaceholderSelected
			]}>
				<Text style={[
					styles.avatarText,
					isSelected && styles.avatarTextSelected
				]}>
					{member.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
				</Text>
			</View>

			{/* Member Info */}
			<View style={styles.memberInfo}>
				<Text style={[
					styles.memberName,
					isSelected && styles.memberNameSelected
				]}>
					{member.name}
				</Text>
				<Text style={[
					styles.memberEmail,
					isSelected && styles.memberEmailSelected
				]} numberOfLines={1}>
					{member.email}
				</Text>
				<View style={[
					styles.roleBadge,
					isSelected && styles.roleBadgeSelected
				]}>
					<Text style={[
						styles.roleText,
						isSelected && styles.roleTextSelected
					]}>
						{member.role}
					</Text>
				</View>
			</View>

			{/* Selection Indicator */}
			<View style={styles.selectionIndicator}>
				{isSelected ? (
					<Ionicons name="checkmark-circle" size={28} color={Colors.success} />
				) : (
					<View style={styles.uncheckedCircle} />
				)}
			</View>
		</TouchableOpacity>
	);
};

export const AttachMemberView = ({ navigation, route }) => {
	const { cartItems } = route.params || { cartItems: [] };

	const { data: initMembers, isLoading, refetch, isFetching } = useQuery({
		queryKey: ['team-members'],
		queryFn: () => getCompany(),
	});

	const [members, setMembers] = useState<Member[]>(DEMO_MEMBERS);
	const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
	const [refreshing, setRefreshing] = useState(false);

	// Update members when data is fetched
	useEffect(() => {
		// if (initMembers) {
		// 	const membersData = Array.isArray(initMembers)
		// 		? initMembers
		// 		: (initMembers?.data?.data || []);

		// 	setMembers(membersData);
		// } else {
		// 	// Use demo data if no API data
		// 	setMembers(DEMO_MEMBERS);
		// }
	}, [initMembers]);

	const handleToggleMember = (id: string) => {
		setSelectedMembers(prev => {
			if (prev.includes(id)) {
				return prev.filter(memberId => memberId !== id);
			} else {
				return [...prev, id];
			}
		});
	};

	const handleSelectAll = () => {
		if (selectedMembers.length === members.length) {
			// Deselect all
			setSelectedMembers([]);
		} else {
			// Select all
			setSelectedMembers(members.map(m => m.id));
		}
	};

	const onRefresh = async () => {
		setRefreshing(true);
		try {
			await refetch();
		} catch (error) {
			// TODO: Handle error
		} finally {
			setRefreshing(false);
		}
	};

	const handleReviewOrder = () => {
		if (selectedMembers.length === 0) return;

		const selectedMemberData = members.filter(m => selectedMembers.includes(m.id));

		navigation.navigate('preview-view');
	};

	const allSelected = members.length > 0 && selectedMembers.length === members.length;

	return (
		<SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
			<StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

			{/* Header */}
			<View style={styles.header}>
				<View style={styles.headerLeft}>
					<TouchableOpacity
						style={styles.backButton}
						onPress={() => navigation.goBack()}
					>
						<Ionicons name="arrow-back" size={24} color={Colors.text} />
					</TouchableOpacity>
					<View>
						<Text style={styles.headerTitle}>Assigner les membres</Text>
						<Text style={styles.headerSubtitle}>
							Sélectionnez les membres pour ces formations
						</Text>
					</View>
				</View>
			</View>

			{/* Loading */}
			{(isLoading || isFetching) && (
				<BouncingDots
					color={Colors.gray}
					size={10}
					bounceHeight={5}
					containerStyle={{
						backgroundColor: Colors.grayLight,
						zIndex: 999,
						elevation: 5,
					}}
				/>
			)}

			{/* Content */}
			{members.length === 0 ? (
				<View style={styles.emptyContainer}>
					<Ionicons name="people-outline" size={80} color={Colors.gray} />
					<Text style={styles.emptyTitle}>Aucun membre</Text>
					<Text style={styles.emptySubtitle}>
						Ajoutez des membres à votre équipe pour leur assigner des formations
					</Text>
				</View>
			) : (
				<>
					{/* Select All Button */}
					<View style={styles.selectAllContainer}>
						<TouchableOpacity
							style={styles.selectAllButton}
							onPress={handleSelectAll}
						>
							<Ionicons
								name={allSelected ? "checkbox" : "square-outline"}
								size={24}
								color={allSelected ? Colors.success : Colors.gray}
							/>
							<Text style={[
								styles.selectAllText,
								allSelected && styles.selectAllTextActive
							]}>
								{allSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
							</Text>
						</TouchableOpacity>

						{selectedMembers.length > 0 && (
							<View style={styles.selectedCountBadge}>
								<Text style={styles.selectedCountText}>
									{selectedMembers.length} sélectionné{selectedMembers.length > 1 ? 's' : ''}
								</Text>
							</View>
						)}
					</View>

					{/* Members List */}
					<ScrollView
						style={styles.scrollView}
						contentContainerStyle={styles.scrollContent}
						showsVerticalScrollIndicator={false}
						refreshControl={
							<RefreshControl
								refreshing={refreshing || isFetching}
								onRefresh={onRefresh}
								colors={[Colors.primary]}
								tintColor={Colors.primary}
							/>
						}
					>
						{members.map((member) => (
							<MemberCard
								key={member.id}
								member={member}
								isSelected={selectedMembers.includes(member.id)}
								onToggle={handleToggleMember}
							/>
						))}

						{/* Spacer for bottom button */}
						<View style={{ height: 100 }} />
					</ScrollView>

					{/* Review Button */}
					<View style={styles.reviewContainer}>
						<View style={styles.reviewInfo}>
							<Text style={styles.reviewLabel}>Membres sélectionnés</Text>
							<Text style={styles.reviewCount}>
								{selectedMembers.length} / {members.length}
							</Text>
						</View>
						<TouchableOpacity
							style={[
								styles.reviewButton,
								selectedMembers.length === 0 && styles.reviewButtonDisabled
							]}
							onPress={handleReviewOrder}
							disabled={selectedMembers.length === 0}
						>
							<Text style={[
								styles.reviewButtonText,
								selectedMembers.length === 0 && styles.reviewButtonTextDisabled
							]}>
								Revoir
							</Text>
							<Ionicons
								name="arrow-forward"
								size={20}
								color={selectedMembers.length === 0 ? Colors.gray : Colors.white}
							/>
						</TouchableOpacity>
					</View>
				</>
			)}
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: Colors.white,
	},
	scrollView: {
		flex: 1,
		backgroundColor: Colors.grayLight,
	},
	scrollContent: {
		padding: Spacings.lg,
		paddingTop: Spacings.xs,
	},
	header: {
		backgroundColor: Colors.white,
		paddingHorizontal: Spacings.lg,
		paddingBottom: Spacings.md,
		borderBottomWidth: 1,
		borderBottomColor: Colors.line,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	headerLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: Spacings.sm,
		flex: 1,
	},
	backButton: {
		padding: 4,
	},
	headerTitle: {
		fontSize: 16,
		fontFamily: 'Poppins-Medium',
		color: Colors.text,
	},
	headerSubtitle: {
		fontSize: 11,
		fontFamily: 'Poppins-Regular',
		color: Colors.gray,
		marginTop: -4,
	},

	// Select All Section
	selectAllContainer: {
		backgroundColor: Colors.white,
		paddingHorizontal: Spacings.lg,
		paddingVertical: Spacings.md,
		borderBottomWidth: 1,
		borderBottomColor: Colors.line,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	selectAllButton: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: Spacings.sm,
	},
	selectAllText: {
		fontSize: 14,
		fontFamily: 'Poppins-Medium',
		color: Colors.gray,
	},
	selectAllTextActive: {
		color: Colors.success,
	},
	selectedCountBadge: {
		backgroundColor: Colors.blue,
		paddingHorizontal: Spacings.md,
		paddingVertical: Spacings.xs,
		borderRadius: 16,
	},
	selectedCountText: {
		fontSize: 11,
		fontFamily: 'Poppins-Medium',
		color: Colors.white,
	},

	// Member Card
	memberCard: {
		backgroundColor: Colors.white,
		borderRadius: 12,
		padding: Spacings.md,
		marginBottom: Spacings.sm,
		flexDirection: 'row',
		alignItems: 'center',
		borderWidth: 2,
		borderColor: Colors.line,
		elevation: 1,
		shadowColor: Colors.black,
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 2,
	},
	memberCardSelected: {
		borderColor: Colors.success,
		backgroundColor: Colors.successBackground,
		elevation: 3,
		shadowOpacity: 0.15,
		shadowRadius: 4,
	},
	avatarPlaceholder: {
		width: 56,
		height: 56,
		borderRadius: 28,
		backgroundColor: Colors.blue,
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: Spacings.md,
	},
	avatarPlaceholderSelected: {
		backgroundColor: Colors.success,
	},
	avatarText: {
		fontSize: 18,
		fontFamily: 'Poppins-Bold',
		color: Colors.white,
	},
	avatarTextSelected: {
		color: Colors.white,
	},
	memberInfo: {
		flex: 1,
		marginRight: Spacings.sm,
	},
	memberName: {
		fontSize: 15,
		fontFamily: 'Poppins-Medium',
		color: Colors.text,
		marginBottom: 2,
	},
	memberNameSelected: {
		color: Colors.success,
	},
	memberEmail: {
		fontSize: 12,
		fontFamily: 'Poppins-Regular',
		color: Colors.gray,
		marginBottom: Spacings.xs,
	},
	memberEmailSelected: {
		color: Colors.text,
	},
	roleBadge: {
		alignSelf: 'flex-start',
		backgroundColor: Colors.grayLight,
		paddingHorizontal: Spacings.sm,
		paddingVertical: 2,
		borderRadius: 12,
	},
	roleBadgeSelected: {
		backgroundColor: Colors.white,
		borderWidth: 1,
		borderColor: Colors.success,
	},
	roleText: {
		fontSize: 10,
		fontFamily: 'Poppins-Medium',
		color: Colors.gray,
	},
	roleTextSelected: {
		color: Colors.success,
	},
	selectionIndicator: {
		marginLeft: Spacings.xs,
	},
	uncheckedCircle: {
		width: 28,
		height: 28,
		borderRadius: 14,
		borderWidth: 2,
		borderColor: Colors.gray,
	},

	// Empty State
	emptyContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: Spacings.xl,
		backgroundColor: Colors.grayLight,
	},
	emptyTitle: {
		fontSize: 18,
		fontFamily: 'Poppins-Medium',
		color: Colors.text,
		marginTop: Spacings.lg,
	},
	emptySubtitle: {
		fontSize: 13,
		fontFamily: 'Poppins-Regular',
		color: Colors.gray,
		marginTop: Spacings.xs,
		textAlign: 'center',
	},

	// Review Button (Similar to Checkout)
	reviewContainer: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		backgroundColor: Colors.white,
		paddingHorizontal: Spacings.lg,
		paddingVertical: Spacings.md,
		borderTopWidth: 1,
		borderTopColor: Colors.line,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		elevation: 8,
		shadowColor: Colors.black,
		shadowOffset: { width: 0, height: -2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
	},
	reviewInfo: {
		flex: 1,
	},
	reviewLabel: {
		fontSize: 12,
		fontFamily: 'Poppins-Regular',
		color: Colors.gray,
	},
	reviewCount: {
		fontSize: 20,
		fontFamily: 'Poppins-Bold',
		color: Colors.text,
	},
	reviewButton: {
		backgroundColor: Colors.blue,
		flexDirection: 'row',
		alignItems: 'center',
		gap: Spacings.xs,
		paddingVertical: Spacings.sm,
		paddingHorizontal: Spacings.lg,
		borderRadius: 24,
		elevation: 3,
		shadowColor: Colors.blue,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.3,
		shadowRadius: 4,
	},
	reviewButtonDisabled: {
		backgroundColor: Colors.grayLight,
		elevation: 0,
	},
	reviewButtonText: {
		fontSize: 13,
		fontFamily: 'Poppins-Medium',
		color: Colors.white,
	},
	reviewButtonTextDisabled: {
		color: Colors.gray,
	},
});
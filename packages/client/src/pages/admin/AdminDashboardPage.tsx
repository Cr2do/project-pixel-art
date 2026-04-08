import { useEffect, useMemo, useState, type ComponentType } from 'react';
import {
	AlertTriangle,
	Brush,
	Clock3,
	LayoutDashboard,
	ShieldCheck,
	SquareChartGantt,
	Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
	applyDefaultDelay,
	getAdminDashboardData,
	increaseBoardDelay,
	resolveOneReport,
	toggleOverridePolicy,
	toggleUserRole,
	type AdminActivity,
	type AdminDashboardData,
	type AdminPixelBoard,
	type AdminUser,
} from '@/services/admin.service';

type MenuKey = 'overview' | 'users' | 'boards' | 'moderation' | 'settings';

interface AdminMenuItem {
	key: MenuKey;
	label: string;
	description: string;
	icon: ComponentType<{ className?: string }>;
}

const menuItems: AdminMenuItem[] = [
	{ key: 'overview', label: 'Overview', description: 'Global monitoring', icon: LayoutDashboard },
	{ key: 'users', label: 'Users', description: 'Accounts and roles', icon: Users },
	{ key: 'boards', label: 'Boards', description: 'Pixel board setup', icon: SquareChartGantt },
	{ key: 'moderation', label: 'Moderation', description: 'Reports and actions', icon: ShieldCheck },
	{ key: 'settings', label: 'Settings', description: 'Runtime preferences', icon: Brush },
];

function formatDate(value: string): string {
	return new Date(value).toLocaleString('fr-FR', {
		year: 'numeric',
		month: 'short',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
	});
}

function kpiCard(title: string, value: string | number, hint: string) {
	return (
		<div className="rounded-2xl border border-border/60 bg-card/80 p-5 shadow-sm backdrop-blur">
			<p className="text-sm text-muted-foreground">{title}</p>
			<p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
			<p className="mt-1 text-xs text-muted-foreground">{hint}</p>
		</div>
	);
}

function userRoleBadge(role: AdminUser['role']) {
	const className = role === 'ADMIN'
		? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700'
		: 'border-slate-500/30 bg-slate-500/10 text-slate-700';

	return (
		<span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${className}`}>
			{role}
		</span>
	);
}

function boardStatusBadge(status: AdminPixelBoard['status']) {
	const className = status === 'IN_PROGRESS'
		? 'border-blue-500/30 bg-blue-500/10 text-blue-700'
		: 'border-zinc-500/30 bg-zinc-500/10 text-zinc-700';

	return (
		<span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${className}`}>
			{status}
		</span>
	);
}

function activityTone(level: AdminActivity['level']) {
	return level === 'warning'
		? 'border-amber-400/35 bg-amber-100/50 text-amber-900'
		: 'border-sky-400/35 bg-sky-100/50 text-sky-900';
}

function anonymizedAccount(user: AdminUser): string {
	return `Account ${user.id.toUpperCase()}`;
}

function anonymizedContact(user: AdminUser): string {
	return `id:${user.id}`;
}

function AdminDashboardPage() {
	const [selectedMenu, setSelectedMenu] = useState<MenuKey>('overview');
	const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);
	const [actionLoading, setActionLoading] = useState<boolean>(false);
	const [feedback, setFeedback] = useState<string | null>(null);

	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
			setError(null);
			try {
				const response = await getAdminDashboardData();
				setDashboardData(response);
			} catch {
				setError('Could not load admin dashboard data.');
			} finally {
				setLoading(false);
			}
		};

		void fetchData();
	}, []);

	const selectedItem = useMemo(
		() => menuItems.find((item) => item.key === selectedMenu) ?? menuItems[0],
		[selectedMenu],
	);

	const defaultDelayLabel = useMemo(() => {
		if (!dashboardData) {
			return 60;
		}

		const activeBoards = dashboardData.pixelBoards.filter((board) => board.status === 'IN_PROGRESS');
		if (activeBoards.length === 0) {
			return 60;
		}

		return activeBoards[0].delay_seconds;
	}, [dashboardData]);

	const overrideEnabled = useMemo(
		() => dashboardData?.pixelBoards.some((board) => board.status === 'IN_PROGRESS' && board.allow_override) ?? false,
		[dashboardData],
	);

	const runAction = async (
		action: () => Promise<AdminDashboardData>,
		successMessage: string,
	) => {
		setActionLoading(true);
		setFeedback(null);
		try {
			const updated = await action();
			setDashboardData(updated);
			setFeedback(successMessage);
		} catch (actionError) {
			const message = actionError instanceof Error ? actionError.message : 'Action failed';
			setFeedback(message);
		} finally {
			setActionLoading(false);
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.12),transparent_40%)] p-4 md:p-8">
				<div className="mx-auto max-w-7xl rounded-3xl border border-border/60 bg-card/75 p-8 shadow-lg backdrop-blur">
					<p className="text-sm font-medium text-muted-foreground">Loading admin workspace...</p>
				</div>
			</div>
		);
	}

	if (error || !dashboardData) {
		return (
			<div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(239,68,68,0.18),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.14),transparent_40%)] p-4 md:p-8">
				<div className="mx-auto flex max-w-2xl items-center gap-3 rounded-2xl border border-destructive/30 bg-card/90 p-6 text-destructive shadow-sm">
					<AlertTriangle className="size-5" />
					<p className="text-sm font-medium">{error ?? 'Unknown error'}</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(20,184,166,0.15),transparent_40%)] px-3 py-4 md:px-6 md:py-8 lg:px-8 lg:py-10">
			<div className="mx-auto w-full max-w-7xl">
				<div className="grid grid-cols-1 gap-4 rounded-3xl border border-border/60 bg-background/80 p-3 shadow-xl backdrop-blur md:grid-cols-[270px_1fr] md:gap-6 md:p-6">
				<aside className="rounded-2xl border border-border/70 bg-card/75 p-3 md:p-4">
					<div className="mb-4 rounded-xl border border-border/60 bg-background/70 p-4">
						<p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Admin zone</p>
						<h1 className="mt-2 text-xl font-semibold tracking-tight">Pixel Art Console</h1>
						<p className="mt-1 text-xs text-muted-foreground">Control users, boards and moderation flow.</p>
					</div>

					<nav className="grid gap-2 max-md:grid-flow-col max-md:auto-cols-[minmax(190px,1fr)] max-md:overflow-x-auto max-md:pb-1 md:grid-flow-row md:auto-cols-auto">
						{menuItems.map((item) => {
							const Icon = item.icon;
							const isActive = selectedMenu === item.key;

							return (
								<button
									key={item.key}
									type="button"
									onClick={() => setSelectedMenu(item.key)}
									className={`w-full rounded-xl border px-3 py-2 text-left transition ${isActive
										? 'border-primary/35 bg-primary/10 shadow-sm'
										: 'border-border/60 bg-background/65 hover:border-border hover:bg-accent/60'
									}`}
								>
									<div className="flex items-start gap-2">
										<Icon className="mt-0.5 size-4 text-primary" />
										<div>
											<p className="text-sm font-semibold">{item.label}</p>
											<p className="text-xs text-muted-foreground">{item.description}</p>
										</div>
									</div>
								</button>
							);
						})}
					</nav>
				</aside>

				<main className="min-w-0 space-y-4 md:space-y-6">
					<header className="rounded-2xl border border-border/70 bg-card/70 p-4 md:p-5">
						<div className="flex flex-wrap items-center justify-between gap-3">
							<div>
								<p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Current section</p>
								<h2 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">{selectedItem.label}</h2>
								<p className="text-sm text-muted-foreground">{selectedItem.description}</p>
							</div>
							<div className="flex items-center gap-2">
								<Button
									variant="outline"
									onClick={() => {
										void runAction(getAdminDashboardData, 'Dashboard refreshed.');
									}}
									disabled={actionLoading}
								>
									Refresh
								</Button>
								<Button
									onClick={() => {
										setSelectedMenu('moderation');
									}}
								>
									New action
								</Button>
							</div>
						</div>
						{feedback && (
							<p className="mt-3 rounded-lg border border-border/60 bg-background/70 px-3 py-2 text-xs text-muted-foreground">
								{feedback}
							</p>
						)}
					</header>

					{selectedMenu === 'overview' && (
						<section className="space-y-4 md:space-y-5">
							<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
								{kpiCard('Total users', dashboardData.kpis.totalUsers, 'Accounts tracked in the platform')}
								{kpiCard('Admin profiles', dashboardData.kpis.totalAdmins, 'Team members with elevated privileges')}
								{kpiCard('Active boards', dashboardData.kpis.activeBoards, 'Boards currently open to edits')}
								{kpiCard('Pending reports', dashboardData.kpis.pendingReports, 'Need moderation review')}
							</div>

							<div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(280px,340px)]">
								<div className="min-w-0 rounded-2xl border border-border/60 bg-card/80 p-4 md:p-5">
									<p className="text-sm font-semibold">Recent users</p>
									<div className="mt-4 overflow-x-auto">
										<table className="w-full text-left text-sm">
											<thead className="text-xs uppercase tracking-wide text-muted-foreground">
												<tr>
													<th className="pb-3">Account</th>
													<th className="pb-3">Identifier</th>
													<th className="pb-3">Role</th>
													<th className="pb-3">Updated</th>
												</tr>
											</thead>
											<tbody>
												{dashboardData.users.length === 0 && (
													<tr>
														<td className="py-4 text-sm text-muted-foreground" colSpan={4}>
															No user data yet. Backend data will appear here.
														</td>
													</tr>
												)}
												{dashboardData.users.map((user) => (
													<tr key={user.id} className="border-t border-border/50">
														<td className="py-3 font-medium">{anonymizedAccount(user)}</td>
														<td className="py-3 text-muted-foreground">{anonymizedContact(user)}</td>
														<td className="py-3">{userRoleBadge(user.role)}</td>
														<td className="py-3 text-xs text-muted-foreground">{formatDate(user.updatedAt)}</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
								</div>

								<div className="min-w-0 rounded-2xl border border-border/60 bg-card/80 p-4 md:p-5">
									<p className="text-sm font-semibold">Activity timeline</p>
									<div className="mt-4 space-y-3">
										{dashboardData.activities.length === 0 && (
											<p className="rounded-xl border border-border/60 bg-background/70 p-3 text-sm text-muted-foreground">
												No activity yet.
											</p>
										)}
										{dashboardData.activities.map((activity) => (
											<div key={activity.id} className={`rounded-xl border p-3 ${activityTone(activity.level)}`}>
												<p className="text-sm font-medium">{activity.message}</p>
												<p className="mt-1 inline-flex items-center gap-1 text-xs opacity-80">
													<Clock3 className="size-3" />
													{formatDate(activity.createdAt)}
												</p>
											</div>
										))}
									</div>
								</div>
							</div>
						</section>
					)}

					{selectedMenu === 'users' && (
						<section className="rounded-2xl border border-border/60 bg-card/80 p-4 md:p-5">
							<p className="text-sm font-semibold">Users and permissions</p>
							<p className="mt-1 text-sm text-muted-foreground">Role switch now updates data instantly (mock behavior).</p>
							<div className="mt-4 grid gap-3">
								{dashboardData.users.length === 0 && (
									<div className="rounded-xl border border-border/60 bg-background/70 p-4 text-sm text-muted-foreground">
										No users available yet.
									</div>
								)}
								{dashboardData.users.map((user) => (
									<div key={user.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/70 p-3">
										<div>
											<p className="font-medium">{anonymizedAccount(user)}</p>
											<p className="text-sm text-muted-foreground">{anonymizedContact(user)}</p>
										</div>
										<div className="flex items-center gap-2">
											{userRoleBadge(user.role)}
											<Button
												size="sm"
												variant="outline"
												disabled={actionLoading}
												onClick={() => {
													void runAction(
														() => toggleUserRole(user.id),
															`Role updated for ${user.id}.`,
													);
												}}
											>
												Switch role
											</Button>
										</div>
									</div>
								))}
							</div>
						</section>
					)}

					{selectedMenu === 'boards' && (
						<section className="rounded-2xl border border-border/60 bg-card/80 p-4 md:p-5">
							<p className="text-sm font-semibold">Pixel boards management</p>
							<p className="mt-1 text-sm text-muted-foreground">Edit board now increases delay by 15s to simulate update.</p>
							<div className="mt-4 grid gap-3">
								{dashboardData.pixelBoards.length === 0 && (
									<div className="rounded-xl border border-border/60 bg-background/70 p-4 text-sm text-muted-foreground">
										No boards available yet.
									</div>
								)}
								{dashboardData.pixelBoards.map((board) => (
									<div key={board.id} className="rounded-xl border border-border/60 bg-background/70 p-4">
										<div className="flex flex-wrap items-center justify-between gap-2">
											<p className="font-semibold">{board.name}</p>
											{boardStatusBadge(board.status)}
										</div>
										<p className="mt-2 text-sm text-muted-foreground">
											{board.width}x{board.height} at ({board.position_x},{' '}
											{board.position_y}) - delay {board.delay_seconds}s - contributors {board.contributorCount}
										</p>
										<div className="mt-3 flex gap-2">
											<Button
												size="sm"
												variant="outline"
												disabled={actionLoading}
												onClick={() => {
													void runAction(
														() => increaseBoardDelay(board.id),
														`Delay increased for ${board.name}.`,
													);
												}}
											>
												Edit board
											</Button>
											<Button
												size="sm"
												variant="ghost"
												onClick={() => {
													setSelectedMenu('moderation');
													setFeedback(`Showing moderation logs for ${board.name}.`);
												}}
											>
												View logs
											</Button>
										</div>
									</div>
								))}
							</div>
						</section>
					)}

					{selectedMenu === 'moderation' && (
						<section className="rounded-2xl border border-border/60 bg-card/80 p-4 md:p-5">
							<p className="text-sm font-semibold">Moderation queue</p>
							<div className="mt-4 grid gap-3 sm:grid-cols-2">
								<div className="rounded-xl border border-amber-500/30 bg-amber-100/40 p-4">
									<p className="text-xs uppercase tracking-wide text-amber-900/80">Pending</p>
									<p className="mt-2 text-3xl font-semibold text-amber-900">{dashboardData.kpis.pendingReports}</p>
									<p className="mt-1 text-sm text-amber-900/80">Reports waiting for a decision.</p>
								</div>
								<div className="rounded-xl border border-border/60 bg-background/70 p-4">
									<p className="text-xs uppercase tracking-wide text-muted-foreground">Recommended action</p>
									<p className="mt-2 font-semibold">Assign one moderator by active board.</p>
									<p className="mt-1 text-sm text-muted-foreground">This keeps response time under 15 minutes.</p>
									<Button
										className="mt-3"
										size="sm"
										disabled={actionLoading}
										onClick={() => {
											void runAction(resolveOneReport, 'One report processed.');
										}}
									>
										Process one report
									</Button>
								</div>
							</div>
						</section>
					)}

					{selectedMenu === 'settings' && (
						<section className="rounded-2xl border border-border/60 bg-card/80 p-4 md:p-5">
							<p className="text-sm font-semibold">Platform settings</p>
							<div className="mt-4 grid gap-3 sm:grid-cols-2">
								<div className="rounded-xl border border-border/60 bg-background/70 p-4">
									<p className="text-sm font-medium">Default board delay</p>
									<p className="mt-1 text-sm text-muted-foreground">
										Current: {defaultDelayLabel}s on active boards.
									</p>
									<Button
										className="mt-3"
										size="sm"
										variant="outline"
										disabled={actionLoading}
										onClick={() => {
											const next = defaultDelayLabel >= 60 ? 30 : defaultDelayLabel + 15;
											void runAction(
												() => applyDefaultDelay(next),
												`Default delay set to ${next}s.`,
											);
										}}
									>
										Cycle delay
									</Button>
								</div>
								<div className="rounded-xl border border-border/60 bg-background/70 p-4">
									<p className="text-sm font-medium">Override policy</p>
									<p className="mt-1 text-sm text-muted-foreground">
										Current: {overrideEnabled ? 'Enabled' : 'Disabled'} for active boards.
									</p>
									<Button
										className="mt-3"
										size="sm"
										variant="outline"
										disabled={actionLoading}
										onClick={() => {
											void runAction(toggleOverridePolicy, 'Override policy toggled.');
										}}
									>
										Configure
									</Button>
								</div>
							</div>
						</section>
					)}
				</main>
				</div>
			</div>
		</div>
	);
}

export default AdminDashboardPage;

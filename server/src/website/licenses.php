<?php
if(!isset($_SESSION['username']) || !isset($_SESSION['token'])){
	$_SESSION['page'] = 'home';
	header('Location: ../..');
	exit();
}

require_once 'Settings.php';

if (isset($_GET['page']) && is_numeric($_GET['page']) && $_GET['page'] >= 1) {
	$page = $_GET['page'];
}else{
	$page = 1;
}

if (!isset($_SESSION['limit']) || !is_numeric($_SESSION['limit']) || $_SESSION['limit'] < 1) {
	$_SESSION['limit'] = 25;
}

$query = 'SELECT * FROM licenses LIMIT :startFrom,:limit';

if (isset($_GET['search']) && strlen($_GET['search']) >= 1) {
	$search = $_GET['search'] . '%';
	$query = 'SELECT * FROM licenses WHERE license LIKE :search OR linked LIKE :search';
}

$startFrom = ($page - 1) * $_SESSION['limit'];

try{
	$conn = Settings::createConnection();

	$totalLicenses = Settings::readLocalData('admin_licenses_count', true);
	if($totalLicenses === null){
		$stmt2 = $conn->prepare('SELECT COUNT(*) as amount FROM licenses;');
		$stmt2->execute();
		$totalLicenses = $stmt2->fetch()['amount'];
		Settings::writeLocalData('admin_licenses_count', $totalLicenses, 300, true);
	}

	$totalPages = (int) ceil($totalLicenses / $_SESSION['limit']);
	if($totalPages !== 0 && $page > $totalPages){
		header('Location: ../..?page=' . $totalPages);
		exit();
	}

	$totalUnusedLicenses = Settings::readLocalData('admin_licenses_unused_count', true);
	if($totalUnusedLicenses === null){
		$stmt3 = $conn->prepare('SELECT COUNT(*) as amount FROM licenses WHERE linked IS NULL;');
		$stmt3->execute();
		$totalUnusedLicenses = $stmt3->fetch()['amount'];
		Settings::writeLocalData('admin_licenses_unused_count', $totalUnusedLicenses, 300, true);
	}

	$stmt = $conn->prepare($query);
	if(isset($search)){
		$stmt->bindParam(':search', $search, PDO::PARAM_STR);
		$stmt->execute();

		$data = $stmt->fetchAll(PDO::FETCH_ASSOC);
	}else{
		$data = Settings::readLocalData('admin_licenses_page_' . $page, true);
		if($data === null){
			$stmt->bindParam(':startFrom', $startFrom, PDO::PARAM_INT);
			$stmt->bindParam(':limit', $_SESSION['limit'], PDO::PARAM_INT);
			$stmt->execute();

			$data = $stmt->fetchAll(PDO::FETCH_ASSOC);
			Settings::writeLocalData('admin_licenses_page_' . $page, serialize($data), 300, true);
		}else{
			$data = unserialize($data);
		}
	}
}catch(PDOException $e) {}
$conn = null;

displayHeader(5);
?>

<div class="flex flex-col">
	<div class="overflow-x-auto">
		<div class="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
			<div class="overflow-hidden sm:rounded-lg">
				<div class="max-w-7xl mx-auto lg:px-8">
					<script>
						sessionStorage.setItem("licenses", JSON.stringify(<?= json_encode($data) ?>));
						<?php if(isset($_SESSION['licenses'])){ ?>
							sessionStorage.setItem("licenseKeys", JSON.stringify(<?= json_encode($_SESSION['licenses']) ?>));
						<?php
							unset($_SESSION['licenses']);
						} ?>
					</script>
					<div class="hidden mb-8 md:block">
						<dl class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
							<div class="px-4 py-5 secondaryBackgroundColor shadow overflow-hidden sm:p-6">
								<dt class="text-sm font-medium secondaryColor truncate">Total Licenses</dt>
								<dd class="mt-1 text-3xl font-semibold tertiaryColor"><?= $totalLicenses ?></dd>
							</div>
							<div class="px-4 py-5 secondaryBackgroundColor shadow overflow-hidden sm:p-6">
								<dt class="text-sm font-medium secondaryColor truncate">Total Unused Licenses</dt>
								<dd class="mt-1 text-3xl font-semibold tertiaryColor"><?= $totalUnusedLicenses ?></dd>
							</div>
							<div class="px-4 py-5 secondaryBackgroundColor shadow overflow-hidden sm:p-6">
								<dt class="text-sm font-medium secondaryColor truncate">Total Used Licenses</dt>
								<dd class="mt-1 text-3xl font-semibold tertiaryColor"><?= $totalLicenses - $totalUnusedLicenses ?></dd>
							</div>
						</dl>
					</div>
					<div class="flex items-center justify-between shadow passwordsBorderColor border-b secondaryBackgroundColor px-4 py-3 sm:px-6">
						<div class="flex flex-1 items-center">
							<div>
								<input id='duration' name='duration' type='number' class='appearance-none rounded-none relative w-20 px-3 py-2 border border-gray-300 placeholder-gray-500 secondaryColor rounded-l-md focus:outline-none focus:z-10 sm:text-sm' placeholder='Days'>
							</div>
							<div>
								<input id='amount' name='amount' type='number' class='appearance-none rounded-none relative w-20 px-3 py-2 border border-gray-300 placeholder-gray-500 secondaryColor focus:outline-none focus:z-10 sm:text-sm' placeholder='Amount'>
							</div>
							<div>
								<button id="create-license" class="primaryButton px-3 py-2 rounded-r-md text-sm font-medium">Create</button>
							</div>
						</div>
					</div>
					<table id="table-licenses" class="min-w-full divide-y divide-gray-200">
						<tbody id="table-data" class="secondaryBackgroundColor divide-y divide-gray-200">
							<?php
								foreach($data as $row){ ?>
									<tr class="passwordsBorderColor">
										<td class="px-6 py-4 whitespace-nowrap">
											<div class="flex">
												<div class="flex-shrink-0 h-10 w-10">
													<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" stroke-width="1.5" stroke="#2c3e50" fill="none" stroke-linecap="round" stroke-linejoin="round">
														<path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
														<circle cx="12" cy="7" r="4"></circle>
														<path d="M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2"></path>
													</svg>
												</div>
												<div class="ml-4">
													<div class="tertiaryColor text-sm font-medium max-w-[16rem] sm:max-w-[21rem] md:max-w-[15rem] lg:max-w-[15rem] xl:max-w-[30rem] 2xl:max-w-[30rem] overflow-hidden text-ellipsis"><?= ($row['linked'] !== null) ? $row['linked'] : 'Unused' ?></div>
													<div class="secondaryColor text-sm max-w-[16rem] sm:max-w-[21rem] md:max-w-[15rem] lg:max-w-[15rem] xl:max-w-[30rem] 2xl:max-w-[30rem] overflow-hidden text-ellipsis"><?= $row['license'] ?></div>
												</div>
											</div>
										</td>
										<td class="passwordsBorderColor border-l border-r hidden md:table-cell px-6 py-4 whitespace-nowrap">
											<div class="flex">
												<div class="flex-shrink-0 h-10 w-10">
													<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" stroke-width="1.5" stroke="#2c3e50" fill="none" stroke-linecap="round" stroke-linejoin="round">
														<path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
														<rect x="4" y="5" width="16" height="16" rx="2"></rect>
														<line x1="16" y1="3" x2="16" y2="7"></line>
														<line x1="8" y1="3" x2="8" y2="7"></line>
														<line x1="4" y1="11" x2="20" y2="11"></line>
														<line x1="11" y1="15" x2="12" y2="15"></line>
														<line x1="12" y1="15" x2="12" y2="18"></line>
													</svg>
												</div>
												<div class="ml-4">
													<div class="tertiaryColor text-sm font-medium max-w-[16rem] sm:max-w-[21rem] md:max-w-[15rem] lg:max-w-[15rem] xl:max-w-[30rem] 2xl:max-w-[30rem] overflow-hidden text-ellipsis">Duration</div>
													<div class="secondaryColor text-sm max-w-[16rem] sm:max-w-[21rem] md:max-w-[15rem] lg:max-w-[15rem] xl:max-w-[30rem] 2xl:max-w-[30rem] overflow-hidden text-ellipsis"><?= $row['duration'] . ' days' ?></div>
												</div>
											</div>
										</td>
										<td class="passwordsBorderColor border-l border-r hidden lg:table-cell px-6 py-4 whitespace-nowrap">
											<div class="flex">
												<div class="flex-shrink-0 h-10 w-10">
													<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" stroke-width="1.5" stroke="#2c3e50" fill="none" stroke-linecap="round" stroke-linejoin="round">
														<path stroke="none" d="M0 0h24v24H0z" fill="none"/>
														<path d="M14 8v-2a2 2 0 0 0 -2 -2h-7a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2 -2v-2" />
														<path d="M20 12h-13l3 -3m0 6l-3 -3" />
													</svg>
												</div>
												<div class="ml-4">
													<div class="tertiaryColor text-sm font-medium max-w-[16rem] sm:max-w-[21rem] md:max-w-[15rem] lg:max-w-[15rem] xl:max-w-[30rem] 2xl:max-w-[30rem] overflow-hidden text-ellipsis"><?= $row['created'] ?></div>
													<div class="secondaryColor text-sm max-w-[16rem] sm:max-w-[21rem] md:max-w-[15rem] lg:max-w-[15rem] xl:max-w-[30rem] 2xl:max-w-[30rem] overflow-hidden text-ellipsis"><?= ($row['used'] !== null) ? $row['used'] : 'Unused' ?></div>
												</div>
											</div>
										</td>
										<td class="w-full"></td>
										<td class="px-2 md:px-4 py-4 whitespace-nowrap">
											<a id="show-info-<?= $row['license'] ?>" href="#">
												<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" stroke-width="1.5" stroke="#2c3e50" fill="none" stroke-linecap="round" stroke-linejoin="round">
													<path stroke="none" d="M0 0h24v24H0z" fill="none"/>
													<circle cx="12" cy="12" r="9" />
													<line x1="12" y1="8" x2="12.01" y2="8" />
													<polyline points="11 12 12 12 12 16 13 16" />
												</svg>
											</a>
										</td>
										<td class="px-2 md:px-4 py-4 whitespace-nowrap">
											<a id="copy-license-<?= $row['license'] ?>" href="#">
												<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" stroke-width="1.5" stroke="#2c3e50" fill="none" stroke-linecap="round" stroke-linejoin="round">
													<path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
													<circle cx="8" cy="15" r="4"></circle>
													<line x1="10.85" y1="12.15" x2="19" y2="4"></line>
													<line x1="18" y1="5" x2="20" y2="7"></line>
													<line x1="15" y1="8" x2="17" y2="10"></line>
												</svg>
											</a>
										</td>
										<td class="px-2 md:px-4 py-4 whitespace-nowrap">
											<a id="delete-license-<?= $row['license'] ?>" href="#">
												<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" stroke-width="1.5" stroke="#2c3e50" fill="none" stroke-linecap="round" stroke-linejoin="round">
													<path stroke="none" d="M0 0h24v24H0z" fill="none"/>
													<line x1="4" y1="7" x2="20" y2="7" />
													<line x1="10" y1="11" x2="10" y2="17" />
													<line x1="14" y1="11" x2="14" y2="17" />
													<path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
													<path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
												</svg>
											</a>
										</td>
										<script>
											document.getElementById('show-info-<?= $row['license'] ?>').addEventListener('click', () => {
												changeDialog(1, '<?= $row['license'] ?>');
												show('dialog');
											});
											document.getElementById('copy-license-<?= $row['license'] ?>').addEventListener('click', () => {
												copyToClipboard('<?= $row['license'] ?>');
												changeDialog(2);
												show('dialog');
											});
											document.getElementById('delete-license-<?= $row['license'] ?>').addEventListener('click', () => {
												changeDialog(3, '<?= $row['license'] ?>');
												show('dialog')
											});
										</script>
									</tr>
							<?php } ?>
						</tbody>
					</table>
					<?php if(!isset($search) && $totalPages > 1){ ?>
						<div class="flex items-center justify-between shadow passwordsBorderColor border-t secondaryBackgroundColor px-4 py-3 sm:px-6">
							<div class="flex flex-1 items-center justify-between">
								<div>
									<p class="text-sm secondaryColor">
										Showing
										<span class="font-medium"><?= $startFrom + 1 ?></span>
										to
										<span class="font-medium"><?= ($startFrom + $_SESSION['limit'] > $totalLicenses) ? $totalLicenses : $startFrom + $_SESSION['limit'] ?></span>
										of
										<span class="font-medium"><?= $totalLicenses ?></span>
										licenses
									</p>
								</div>
								<?php if($totalPages > 1){ ?>
								<div>
									<nav class="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
										<?php if($page !== 1){ ?>
											<a href="?page=<?= $page - 1 ?>" class="relative inline-flex items-center rounded-l-md border primaryBorderColor tertiaryBackgroundColor px-2 py-2 text-sm font-medium secondaryColor focus:z-20">
												<span class="sr-only">Previous</span>
												<svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
													<path fill-rule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clip-rule="evenodd" />
												</svg>
											</a>
										<?php } ?>

										<?php if($totalPages >= 4){ ?>
											<input id="page" type="number" value="<?= $page ?>" min="1" max="<?= $totalPages ?>" class="relative inline-flex items-center border primaryBorderColor tertiaryBackgroundColor appearance-none text-center focus:outline-none px-4 py-2 text-sm font-medium secondaryColor">
										<?php }else{ ?>
											<span class="relative inline-flex items-center border primaryBorderColor tertiaryBackgroundColor px-4 py-2 text-sm font-medium secondaryColor"><?= $page ?></span>
										<?php } ?>

										<?php if($page !== $totalPages){ ?>
											<a href="?page=<?= $page + 1 ?>" class="relative inline-flex items-center rounded-r-md border primaryBorderColor tertiaryBackgroundColor px-2 py-2 text-sm font-medium secondaryColor focus:z-20">
												<span class="sr-only">Next</span>
												<svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
													<path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" />
												</svg>
											</a>
										<?php } ?>
									</nav>
								</div>
								<?php } ?>
							</div>
						</div>
					<?php } ?>
					<input type="hidden" id="token" value="<?php echo $_SESSION['token'] ?? ''; ?>">
				</div>
			</div>
		</div>
	</div>
</div>

<?php displayFooter(array('licenses.js')); ?>
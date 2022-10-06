<?php
if(!isset($_SESSION['username']) || !isset($_SESSION['token'])){
	$_SESSION['page'] = "home";
	header("Location: ../..");
}

require_once "Settings.php";

displayHeader(2);
?>

<div class="flex flex-col">
	<div class="overflow-x-auto">
		<div class="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
			<div class="overflow-hidden sm:rounded-lg">
				<div class="max-w-7xl mx-auto lg:px-8">
					<?php

						try{
							$conn = new PDO("mysql:host=" . Settings::getDBHost() . ";dbname=" . Settings::getDBName(), Settings::getDBUsername(), Settings::getDBPassword());
							$conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

							$stmt = $conn->prepare("SELECT u.user_id as user_id, u.username as username, u.email as email, u.backup_codes as backup_codes, u.created as created, u.accessed as accessed, COUNT(p.password_id) as passwords, u.max_passwords as max_passwords from users u LEFT JOIN passwords p ON u.username = p.owner GROUP BY u.username;");
							$stmt->execute();

							$data = $stmt->fetchAll(PDO::FETCH_ASSOC);
							?>
							<script>
								sessionStorage.setItem("accounts", JSON.stringify(<?= json_encode($data) ?>));
							</script>
							<?php

							$totalPasswords = 0;
							foreach($data as $row){
								$totalPasswords += $row['passwords'];
							}
							?>
							<div class="hidden mb-8 md:block">
								<dl class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
									<div class="px-4 py-5 secondaryBackgroundColor shadow overflow-hidden sm:p-6">
										<dt class="text-sm font-medium secondaryColor truncate">Total Accounts</dt>
										<dd id="stats-accounts" class="mt-1 text-3xl font-semibold tertiaryColor"><?= $stmt->rowCount() ?></dd>
									</div>
									<div class="px-4 py-5 secondaryBackgroundColor shadow overflow-hidden sm:p-6">
										<dt class="text-sm font-medium secondaryColor truncate">Total Passwords</dt>
										<dd id="stats-passwords" class="mt-1 text-3xl font-semibold tertiaryColor"><?= $totalPasswords ?></dd>
									</div>
									<div class="px-4 py-5 secondaryBackgroundColor shadow overflow-hidden sm:p-6">
										<dt class="text-sm font-medium secondaryColor truncate">Server Version</dt>
										<dd class="mt-1 text-3xl font-semibold tertiaryColor">7.1.0</dd>
									</div>
								</dl>
							</div>
							<table id="table-accounts" class="min-w-full divide-y divide-gray-200">
								<tbody id="table-data" class="secondaryBackgroundColor divide-y divide-gray-200">
									<?php
										if($stmt->rowCount() > 0){
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
																<div class="tertiaryColor text-sm font-medium max-w-[16rem] sm:max-w-[21rem] md:max-w-[15rem] lg:max-w-[15rem] xl:max-w-[30rem] 2xl:max-w-[30rem] overflow-hidden text-ellipsis"><?= $row['username'] ?></div>
																<div class="secondaryColor text-sm max-w-[16rem] sm:max-w-[21rem] md:max-w-[15rem] lg:max-w-[15rem] xl:max-w-[30rem] 2xl:max-w-[30rem] overflow-hidden text-ellipsis"><?= $row['email'] ?></div>
															</div>
														</div>
													</td>
													<td class="passwordsBorderColor border-l border-r hidden md:table-cell px-6 py-4 whitespace-nowrap">
														<div class="flex">
															<div class="flex-shrink-0 h-10 w-10">
																<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" stroke-width="1.5" stroke="#2c3e50" fill="none" stroke-linecap="round" stroke-linejoin="round">
																	<path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
																	<circle cx="8" cy="15" r="4"></circle>
																	<line x1="10.85" y1="12.15" x2="19" y2="4"></line>
																	<line x1="18" y1="5" x2="20" y2="7"></line>
																	<line x1="15" y1="8" x2="17" y2="10"></line>
																</svg>
															</div>
															<div class="ml-4">
																<div class="tertiaryColor text-sm font-medium max-w-[16rem] sm:max-w-[21rem] md:max-w-[15rem] lg:max-w-[15rem] xl:max-w-[30rem] 2xl:max-w-[30rem] overflow-hidden text-ellipsis">Passwords</div>
																<div class="secondaryColor text-sm max-w-[16rem] sm:max-w-[21rem] md:max-w-[15rem] lg:max-w-[15rem] xl:max-w-[30rem] 2xl:max-w-[30rem] overflow-hidden text-ellipsis"><?= $row['passwords'] . " / " . $row['max_passwords'] ?></div>
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
																<div class="secondaryColor text-sm max-w-[16rem] sm:max-w-[21rem] md:max-w-[15rem] lg:max-w-[15rem] xl:max-w-[30rem] 2xl:max-w-[30rem] overflow-hidden text-ellipsis"><?= $row['accessed'] ?></div>
															</div>
														</div>
													</td>
													<td class="w-full"></td>
													<td class="px-2 md:px-4 py-4 whitespace-nowrap">
														<a id="show-info-<?= $row['username'] ?>" href="#">
															<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" stroke-width="1.5" stroke="#2c3e50" fill="none" stroke-linecap="round" stroke-linejoin="round">
																<path stroke="none" d="M0 0h24v24H0z" fill="none"/>
																<circle cx="12" cy="12" r="9" />
																<line x1="12" y1="8" x2="12.01" y2="8" />
																<polyline points="11 12 12 12 12 16 13 16" />
															</svg>
														</a>
													</td>
													<td class="px-2 md:px-4 py-4 whitespace-nowrap">
														<a id="edit-account-<?= $row['username'] ?>" href="#">
															<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" stroke-width="1.5" stroke="#2c3e50" fill="none" stroke-linecap="round" stroke-linejoin="round">
																<path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
																<path d="M9 7h-3a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-3"></path>
																<path d="M9 15h3l8.5 -8.5a1.5 1.5 0 0 0 -3 -3l-8.5 8.5v3"></path>
																<line x1="16" y1="5" x2="19" y2="8"></line>
															</svg>
														</a>
													</td>
													<td class="px-2 md:px-4 py-4 whitespace-nowrap">
														<a id="delete-account-<?= $row['username'] ?>" href="#">
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
														document.getElementById("show-info-<?= $row['username'] ?>").addEventListener("click", () => {
															changeDialog(1, "<?= $row['username'] ?>");
															show('dialog');
														});
														document.getElementById("edit-account-<?= $row['username'] ?>").addEventListener("click", () => {
															changeDialog(2, "<?= $row['username'] ?>");
															show('dialog');
														});
														document.getElementById("delete-account-<?= $row['username'] ?>").addEventListener("click", () => {
															changeDialog(3, "<?= $row['username'] ?>");
															show('dialog');
														});
													</script>
												</tr>
											<?php }
										}
									?>
								</tbody>
							</table>
							<input type="hidden" id="token" value="<?php echo $_SESSION['token'] ?? ''; ?>">
							<?php
						}catch(PDOException $e) {
							echo "<p class='text-base text-center mt-12 tertiaryColor'>" . $e->getMessage() . "</p>";
						}
						$conn = null;
					?>
				</div>
			</div>
		</div>
	</div>
</div>

<?php displayFooter(array('accounts.js')); ?>
<?php displayHeader(1); ?>

<section id="stats">
	<div class="max-w-7xl mx-auto py-12 px-4 sm:py-16 sm:px-6 lg:px-8">
		<h2 class="text-center mb-6 text-3xl font-extrabold tertiaryColor sm:text-4xl">
			Server Stats
		</h2>
		<div class="max-w-3xl mx-auto">
			<div class="flex flex-col">
				<div class="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
					<div class="py-2 align-middle inline-block min-w-full">
						<div class="shadow overflow-hidden sm:rounded-lg">
							<div>
								<dl class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
									<div class="relative secondaryBackgroundColor pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden">
										<dt>
											<div class="absolute rounded-md p-3">
												<svg class="h-6 w-6 secondaryColor" xmlns="http://www.w3.org/2000/svg" fill="none" stroke-width="1.5" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
													<path stroke="none" d="M0 0h24v24H0z" fill="none"/>
													<rect x="5" y="5" width="14" height="14" rx="1" />
													<path d="M9 9h6v6h-6z" />
													<path d="M3 10h2" />
													<path d="M3 14h2" />
													<path d="M10 3v2" />
													<path d="M14 3v2" />
													<path d="M21 10h-2" />
													<path d="M21 14h-2" />
													<path d="M14 21v-2" />
													<path d="M10 21v-2" />
												</svg>
											</div>
											<p class="ml-16 text-sm font-medium secondaryColor truncate">CPU Usage</p>
										</dt>
										<dd class="ml-16 flex items-baseline">
											<p id="stats-cpu-text" class="text-2xl font-semibold secondaryColor">0%</p>
											<div class="absolute bottom-0 inset-x-0 secondaryBackgroundColor px-4 pb-4 sm:px-6">
												<div class="w-full tertiaryBackgroundColor rounded-full">
													<div id="stats-cpu-bar" class="quaternaryBackgroundColor text-xs font-medium text-blue-100 text-center h-2 leading-none rounded-full w-0"></div>
												</div>
											</div>
										</dd>
									</div>
									<div class="relative secondaryBackgroundColor pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden">
										<dt>
											<div class="absolute rounded-md p-3">
												<svg class="h-6 w-6 secondaryColor" xmlns="http://www.w3.org/2000/svg" fill="none" stroke-width="1.5" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
													<path stroke="none" d="M0 0h24v24H0z" fill="none"/>
													<path d="M10 3.2a9 9 0 1 0 10.8 10.8a1 1 0 0 0 -1 -1h-3.8a4.1 4.1 0 1 1 -5 -5v-4a0.9 .9 0 0 0 -1 -.8" />
													<path d="M15 3.5a9 9 0 0 1 5.5 5.5h-4.5a9 9 0 0 0 -1 -1v-4.5" />
												</svg>
											</div>
											<p class="ml-16 text-sm font-medium secondaryColor truncate">RAM Usage</p>
										</dt>
										<dd class="ml-16 flex items-baseline">
											<p id="stats-ram-text" class="text-xl font-semibold secondaryColor">0%</p>
											<div class="absolute bottom-0 inset-x-0 secondaryBackgroundColor px-4 pb-4 sm:px-6">
												<div class="w-full tertiaryBackgroundColor rounded-full">
													<div id="stats-ram-bar" class="quaternaryBackgroundColor text-xs font-medium text-blue-100 text-center h-2 leading-none rounded-full w-0"></div>
												</div>
											</div>
										</dd>
									</div>
									<div class="relative secondaryBackgroundColor pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden">
										<dt>
											<div class="absolute rounded-md p-3">
												<svg class="h-6 w-6 secondaryColor" xmlns="http://www.w3.org/2000/svg" fill="none" stroke-width="1.5" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
													<path stroke="none" d="M0 0h24v24H0z" fill="none"/>
													<ellipse cx="12" cy="6" rx="8" ry="3">
													</ellipse>
													<path d="M4 6v6a8 3 0 0 0 16 0v-6" />
													<path d="M4 12v6a8 3 0 0 0 16 0v-6" />
												</svg>
											</div>
											<p class="ml-16 text-sm font-medium secondaryColor truncate">Storage Usage</p>
										</dt>
										<dd class="ml-16 flex items-baseline">
											<p id="stats-storage-text" class="text-xl font-semibold secondaryColor">0%</p>
											<div class="absolute bottom-0 inset-x-0 secondaryBackgroundColor px-4 pb-4 sm:px-6">
												<div class="w-full tertiaryBackgroundColor rounded-full">
													<div id="stats-storage-bar" class="quaternaryBackgroundColor text-xs font-medium text-blue-100 text-center h-2 leading-none rounded-full w-0"></div>
												</div>
											</div>
										</dd>
									</div>
									<div class="relative secondaryBackgroundColor pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden">
										<dt>
											<div class="absolute rounded-md p-3">
												<svg class="h-6 w-6 secondaryColor" xmlns="http://www.w3.org/2000/svg" fill="none" stroke-width="1.5" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
													<path stroke="none" d="M0 0h24v24H0z" fill="none"/>
													<circle cx="12" cy="7" r="4" />
													<path d="M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
												</svg>
											</div>
											<p class="ml-16 text-sm font-medium secondaryColor truncate">Accounts</p>
										</dt>
										<dd class="ml-16 flex items-baseline">
											<p id="stats-accounts-text" class="text-xl font-semibold secondaryColor">0</p>
											<div class="absolute bottom-0 inset-x-0 secondaryBackgroundColor px-4 pb-4 sm:px-6">
												<div class="w-full tertiaryBackgroundColor rounded-full">
													<div id="stats-accounts-bar" class="quaternaryBackgroundColor text-xs font-medium text-blue-100 text-center h-2 leading-none rounded-full w-0"></div>
												</div>
											</div>
										</dd>
									</div>
									<div class="relative secondaryBackgroundColor pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden">
										<dt>
											<div class="absolute rounded-md p-3">
												<svg class="h-6 w-6 secondaryColor" xmlns="http://www.w3.org/2000/svg" fill="none" stroke-width="1.5" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
													<path stroke="none" d="M0 0h24v24H0z" fill="none"/>
													<rect x="5" y="11" width="14" height="10" rx="2" />
													<circle cx="12" cy="16" r="1" />
													<path d="M8 11v-4a4 4 0 0 1 8 0v4" />
												</svg>
											</div>
											<p class="ml-16 text-sm font-medium secondaryColor truncate">Passwords</p>
										</dt>
										<dd class="ml-16 flex items-baseline">
											<p id="stats-passwords-text" class="text-xl font-semibold secondaryColor">0 (0)</p>
											<div class="absolute bottom-0 inset-x-0 secondaryBackgroundColor px-4 pb-4 sm:px-6">
												<div class="w-full tertiaryBackgroundColor rounded-full">
													<div id="stats-passwords-bar" class="quaternaryBackgroundColor text-xs font-medium text-blue-100 text-center h-2 leading-none rounded-full w-0"></div>
												</div>
											</div>
										</dd>
									</div>
									<div class="relative secondaryBackgroundColor pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden">
										<dt>
											<div class="absolute rounded-md p-3">
												<svg class="h-6 w-6 secondaryColor" xmlns="http://www.w3.org/2000/svg" fill="none" stroke-width="1.5" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
													<path stroke="none" d="M0 0h24v24H0z" fill="none"/>
													<circle cx="12" cy="9" r="6" />
													<polyline points="9 14.2 9 21 12 19 15 21 15 14.2" transform="rotate(-30 12 9)" />
													<polyline points="9 14.2 9 21 12 19 15 21 15 14.2" transform="rotate(30 12 9)" />
												</svg>
											</div>
											<p class="ml-16 text-sm font-medium secondaryColor truncate">Server version</p>
										</dt>
										<dd class="ml-16 flex items-baseline">
											<p id="stats-version-text" class="text-2xl font-semibold secondaryColor">0.0.0</p>
											<div class="absolute bottom-0 inset-x-0 secondaryBackgroundColor px-4 pb-4 sm:px-6">
												<div class="w-full tertiaryBackgroundColor rounded-full">
													<div id="stats-version-bar" class="quaternaryBackgroundColor text-xs font-medium text-blue-100 text-center h-2 leading-none rounded-full w-0"></div>
												</div>
											</div>
										</dd>
									</div>
								</dl>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<?php displayFooter(array('qrcode.js', 'server.js')); ?>
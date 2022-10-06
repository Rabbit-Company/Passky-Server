<?php 

function displayFooter($scripts){ ?>
	<div id="dialog" class="fixed z-10 inset-0 overflow-y-auto invisible" aria-labelledby="dialog-title" role="dialog" aria-modal="true">
		<div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
			<div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
			<span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
			<div class="secondaryBackgroundColor inline-block align-bottom rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
				<div class="sm:flex sm:items-start">
					<div id="dialog-icon" class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
						<svg class="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
						</svg>
					</div>
					<div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
						<h3 class="tertiaryColor text-lg leading-6 font-medium" id="dialog-title"></h3>
						<div class="mt-2">
							<p class="secondaryColor text-sm" id="dialog-text"></p>
						</div>
					</div>
				</div>
				<div class="mt-5 sm:mt-4 sm:ml-10 sm:pl-4 sm:flex">
					<button id="dialog-button" type="button" class="dangerButton inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium sm:w-auto sm:text-sm"></button>
					<button id="dialog-button-cancel" type="button" class="cancelButton mt-2 w-full inline-flex justify-center rounded-md border px-4 py-2 text-base font-medium shadow-sm focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
						Cancel
					</button>
				</div>
			</div>
		</div>
	</div>
	<script src="./website/js/default-functions.js"></script>
	<?php foreach ($scripts as &$script) { ?>
		<?= "<script src='./website/js/" . $script . "'></script>" ?>
	<?php } ?>
	</body>
</html>

<?php } ?>
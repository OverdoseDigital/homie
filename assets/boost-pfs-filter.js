// Override Settings
var boostPFSFilterConfig = {
	general: {
		limit: boostPFSThemeConfig.custom.products_per_page,
		/* Optional */
		loadProductFirst: true,
	},
};

/************************** BUILD PRODUCT LIST **************************/
(function() {
	BoostPFS.inject(this);

	/* some code */
	// Build Product Grid Item
	ProductGridItem.prototype.compileTemplate = function(data, index, totalProduct) {
		if (!data) data = this.data;
		/*** Prepare data ***/
		var images = data.images_info;
		// Displaying price base on the policy of Shopify, have to multiple by 100
		var soldOut = !data.available; // Check a product is out of stock
		var onSale = data.compare_at_price_min > data.price_min; // Check a product is on sale
		var priceVaries = data.price_min != data.price_max; // Check a product has many prices
		// Get First Variant (selected_or_first_available_variant)
		var firstVariant = data['variants'][0];
		if (Utils.getParam('variant') !== null && Utils.getParam('variant') != '') {
			var paramVariant = data.variants.filter(function(e) { return e.id == Utils.getParam('variant'); });
			if (typeof paramVariant[0] !== 'undefined') firstVariant = paramVariant[0];
		} else {
			for (var i = 0; i < data['variants'].length; i++) {
				if (data['variants'][i].available) {
					firstVariant = data['variants'][i];
					break;
				}
			}
		}
		/*** End Prepare data ***/

		// Get Template
		var itemHtml = boostPFSTemplate.productGridItemHtml;
      
      	itemHtml = itemHtml.replace(/{{itemClassGridItemWidth}}/g, boostPFSConfig.custom.grid_item_width);
      	itemHtml = itemHtml.replace(/{{itemAosProductPerRow}}/g, boostPFSConfig.custom.products_per_row);

		// Get Image size
		var imgSize = '450x650';
		switch (boostPFSConfig.custom.products_per_row) {
			case 5:
				imgSize = '350x550';
				break;
			case 4:
				imgSize = '450x650';
				break;
			case 3:
				imgSize = '450x650';
				break;
			case 2:
				imgSize = '850x1050';
				break;
			case 1:
				imgSize = '1400x1800';
				break;
		}

		// Add Thumbnail
		var aspectRatio = images.length > 0 ? images[0]['width'] / images[0]['height'] : 1;
		var paddingBottom = images.length > 0 ? 100 / aspectRatio : 100;
		var itemThumbUrl = images.length > 0 ? Utils.optimizeImage(images[0]['src'], imgSize) : boostPFSConfig.general.no_image_url;
		var thumb = images.length > 0 ? images[0] : { src: boostPFSConfig.general.no_image_url, width: 500, height: 500 };
		var bgset = buildBgSet(thumb);
		var itemImagesHtml = '';
		if (boostPFSConfig.custom.product_grid_image_size == 'natural') {
			itemImagesHtml += '<div class="image-wrap" style="height: 0; padding-bottom: ' + paddingBottom + '%;">' +
				'<img ' +
				'class="grid-view-item__image lazyload" ' +
				'data-src="' + Utils.getFeaturedImage(images, '{width}x') + '" ' +
				'data-widths="[180, 360, 540, 720, 900, 1080, 1296, 1512, 1728, 2048]" ' +
				'data-aspectratio="' + aspectRatio + '" ' +
				'data-sizes="auto" ' +
				'alt="{{itemTitle}}">' +
				'</div>';
			if (!soldOut) {
				if (boostPFSConfig.custom.product_hover_image && images.length > 1) {
					bgset = buildBgSet(images[1]);
					itemImagesHtml += '<div ' +
						'class="grid-product__secondary-image small--hide lazyload"' +
						'data-bgset="' + bgset + '"' +
						'data-sizes="auto">' +
						'</div>';
				}
			}
		} else {
			itemImagesHtml += '<div ' +
				'class="grid__image-ratio grid__image-ratio--' + boostPFSConfig.custom.product_grid_image_size + ' lazyload"' +
				'data-bgset="' + bgset + '"' +
				'data-sizes="auto">' +
				'</div>';
		}

		if (!soldOut) {
			if (boostPFSConfig.custom.product_hover_image && images.length > 1) {
				var bgset = buildBgSet(images[1]);
				itemImagesHtml += '<div ' +
					'class="grid-product__secondary-image small--hide lazyload"' +
					'data-bgset="' + bgset + '"' +
					'data-sizes="auto">' +
					'</div>';
			}
		}

		itemHtml = itemHtml.replace(/{{itemImages}}/g, itemImagesHtml);

		// Add Price
		var itemPriceHtml = '';
		if (onSale) {
			itemPriceHtml += '<span class="visually-hidden">' + boostPFSConfig.label.regular_price + '</span>';
			itemPriceHtml += '<span class="grid-product__price--original">' + Utils.formatMoney(data.compare_at_price_min) + '</span>';
			itemPriceHtml += '<span class="visually-hidden">' + boostPFSConfig.label.sale_price + '</span>';
		}
		if (priceVaries) {
			itemPriceHtml += boostPFSConfig.label.from_text_html.replace(/{{ price }}/g, Utils.formatMoney(data.price_min));
		} else {
			itemPriceHtml += Utils.formatMoney(data.price_min);
		}
		itemHtml = itemHtml.replace(/{{itemPrice}}/g, itemPriceHtml);

		// Add soldOut class
		var itemSoldOutClass = soldOut ? 'grid-product__link--disabled' : '';
		itemHtml = itemHtml.replace(/{{itemSoldOutClass}}/g, itemSoldOutClass);

		// Add soldOut Label
		var itemSoldOutLabelHtml = soldOut ? '<div class="grid-product__tag">' + boostPFSConfig.label.sold_out + '</div>' : '';
		itemHtml = itemHtml.replace(/{{itemSoldOutLabel}}/g, itemSoldOutLabelHtml);

		// Add onSale Label
		var itemSaleLabelHtml = '';
		if (onSale && !soldOut) {
			var savePrice = Utils.formatMoney(data.compare_at_price_min - data.price_min);
			itemSaleLabelHtml = '<div class="grid-product__tag">' + boostPFSConfig.label.save_html.replace(/{{ saved_amount }}/g, savePrice) + '</div>';
		}
		itemHtml = itemHtml.replace(/{{itemSaleLabel}}/g, itemSaleLabelHtml);

		// Add Vendor
		var itemVendorHtml = boostPFSConfig.custom.vendor_enable ? '<div class="grid-product__vendor">' + data.vendor + '</div>' : '';
		itemHtml = itemHtml.replace(/{{itemVendor}}/g, itemVendorHtml);

		// Add Quick shop
		var itemQuickShopClass = '';
		var itemQuickShopButtonHtml = '';
		if (boostPFSConfig.custom.quick_shop_enable && !soldOut) {
			itemQuickShopClass = 'grid-product__has-quick-shop';
			itemQuickShopButtonHtml = '<div class="quick-product__btn js-modal-open-quick-modal-{{itemId}} small--hide" data-product-id="{{itemId}}">' +
				'<span class="quick-product__label">' + boostPFSConfig.label.quick_shop + '</span>' +
				'</div>';
		}
		itemHtml = itemHtml.replace(/{{itemQuickShopClass}}/g, itemQuickShopClass);
		itemHtml = itemHtml.replace(/{{itemQuickShopButton}}/g, itemQuickShopButtonHtml);

		// Build content for Modal
		if (!Utils.isMobile() && boostPFSConfig.custom.quick_shop_enable) {
			var quickUrl = Utils.buildProductItemUrl(data) + '?view=boost-pfs-quickview';
			jQ.ajax({
				url: quickUrl,
				success: function(result) {
					jQ('#QuickShopModal-' + data.id).html(result);

					if (index == totalProduct) {
						theme.initQuickShop();
						AOS.init({
							easing: 'ease-out-quad',
							once: true
						});

						window.sections = new theme.Sections();
						sections.register('product', theme.Product);
						sections.register('product-template', theme.Product);
						sections.register('collection-template', theme.Collection);
					}
				}
			});
		}
		// Add Reviews
		if (typeof Integration === 'undefined' || !Integration.hascompileTemplate('reviews')) {
			var itemReviewsHtml = '';
			if (boostPFSConfig.custom.enable_product_reviews) {
				itemReviewsHtml = '<span class="shopify-product-reviews-badge" data-id="' + data.id + '"></span>';
			}
			itemHtml = itemHtml.replace(/{{itemReviews}}/g, itemReviewsHtml);
		}

		// Add Swatch
		var itemSwatchHtml = buildSwatch(data, this);
		itemHtml = itemHtml.replace(/{{itemSwatch}}/g, itemSwatchHtml);
		// Add main attribute (Always put at the end of this function)
		itemHtml = itemHtml.replace(/{{itemId}}/g, data.id);
		itemHtml = itemHtml.replace(/{{itemHandle}}/g, data.handle);
		itemHtml = itemHtml.replace(/{{itemTitle}}/g, data.title);
		itemHtml = itemHtml.replace(/{{itemUrl}}/g, Utils.buildProductItemUrl(data));

		return itemHtml;
	};
	// Build Swatch
	function buildSwatch(data, ob) {
		var _this = ob;
		var itemSwatchHtml = '';
		if (boostPFSConfig.custom.collection_color_swatches) {
			var swatch_file_extension = 'png';
			var color_count = 0;
			data.options_with_values.forEach(function(option, index) {
				var option_name = option.name.toLowerCase();
				if (option_name.indexOf('color') != -1 || option_name.indexOf('colour') != -1) {
					var option_index = index;
					var values = '';
					itemSwatchHtml += ' <div class="grid-product__colors grid-product__colors--' + data.id + '" >';
					data.variants.forEach(function(variant) {
						var temp = variant.merged_options[option_index].split(':');
						var value = temp[1];
						if (values.indexOf(value) == -1) {
							color_count++;
							values = values + ',' + value;
							values = values.split(',');
							var color_image = Utils.optimizeImage(variant.image, '50px');
							var color_swatch_fallback = value;
							var classImageSwatch = variant.image ? 'color-swatch--with-image color-swatch--small' : 'color-swatch--small';
							var attImage = '';
							if (variant.image) {
								var variant_image = Utils.optimizeImage(variant.image, '400px');
								attImage += 'data-variant-id="' + variant.id + '"';
								attImage += 'data-variant-image="' + variant_image + '"';
							}
							itemSwatchHtml += '<a  href="' + Utils.buildProductItemUrl(data) + '?variant=' + variant.id + '"' + attImage + ' class="color-swatch ' + classImageSwatch + '" style="background-image: url(' + color_image + '); background-color: ' + color_swatch_fallback + ';">';
							itemSwatchHtml += '</a>';
						}
					});
					itemSwatchHtml += '</div>';
				}
			});
			if (color_count < 2) {
				itemSwatchHtml += '<style>.grid-product__colors--' + data.id + ' {display: none;}</style>';
			}
		}
		return itemSwatchHtml;
	}
	/************************** END BUILD PRODUCT LIST **************************/

	// Build Pagination
	ProductPaginationDefault.prototype.compileTemplate = function(totalProduct) {
		if (!totalProduct) totalProduct = this.totalProduct;
		// Get page info
		var currentPage = parseInt(Globals.queryParams.page);
		var totalPage = Math.ceil(totalProduct / Globals.queryParams.limit);

		if (totalPage > 1) {
			var paginationHtml = boostPFSTemplate.paginateHtml;

			// Build Previous
			var previousHtml = (currentPage > 1) ? boostPFSTemplate.previousActiveHtml : boostPFSTemplate.previousDisabledHtml;
			previousHtml = previousHtml.replace(/{{itemUrl}}/g, Utils.buildToolbarLink('page', currentPage, currentPage - 1));
			paginationHtml = paginationHtml.replace(/{{previous}}/g, previousHtml);

			// Build Next
			var nextHtml = (currentPage < totalPage) ? boostPFSTemplate.nextActiveHtml : boostPFSTemplate.nextDisabledHtml;
			nextHtml = nextHtml.replace(/{{itemUrl}}/g, Utils.buildToolbarLink('page', currentPage, currentPage + 1));
			paginationHtml = paginationHtml.replace(/{{next}}/g, nextHtml);

			// Create page items array
			var beforeCurrentPageArr = [];
			for (var iBefore = currentPage - 1; iBefore > currentPage - 3 && iBefore > 0; iBefore--) {
				beforeCurrentPageArr.unshift(iBefore);
			}
			if (currentPage - 4 > 0) {
				beforeCurrentPageArr.unshift('...');
			}
			if (currentPage - 4 >= 0) {
				beforeCurrentPageArr.unshift(1);
			}
			beforeCurrentPageArr.push(currentPage);

			var afterCurrentPageArr = [];
			for (var iAfter = currentPage + 1; iAfter < currentPage + 3 && iAfter <= totalPage; iAfter++) {
				afterCurrentPageArr.push(iAfter);
			}
			if (currentPage + 3 < totalPage) {
				afterCurrentPageArr.push('...');
			}
			if (currentPage + 3 <= totalPage) {
				afterCurrentPageArr.push(totalPage);
			}

			// Build page items
			var pageItemsHtml = '';
			var pageArr = beforeCurrentPageArr.concat(afterCurrentPageArr);
			for (var iPage = 0; iPage < pageArr.length; iPage++) {
				if (pageArr[iPage] == '...') {
					pageItemsHtml += boostPFSTemplate.pageItemRemainHtml;
				} else {
					pageItemsHtml += (pageArr[iPage] == currentPage) ? boostPFSTemplate.pageItemSelectedHtml : boostPFSTemplate.pageItemHtml;
				}
				pageItemsHtml = pageItemsHtml.replace(/{{itemTitle}}/g, pageArr[iPage]);
				pageItemsHtml = pageItemsHtml.replace(/{{itemUrl}}/g, Utils.buildToolbarLink('page', currentPage, pageArr[iPage]));
			}
			paginationHtml = paginationHtml.replace(/{{pageItems}}/g, pageItemsHtml);

			return paginationHtml;
		}

		return '';
	};

	/************************** BUILD TOOLBAR **************************/

	// Build Sorting
	ProductSorting.prototype.compileTemplate = function() {
		var html = '';

		if (boostPFSTemplate.hasOwnProperty('sortingHtml')) {
			var sortingArr = Utils.getSortingList();
			if (sortingArr) {
				// Build content
				var sortingItemsHtml = '';
				for (var k in sortingArr) {
					sortingItemsHtml += '<option value="' + k + '">' + sortingArr[k] + '</option>';
				}
				html = boostPFSTemplate.sortingHtml.replace(/{{sortingItems}}/g, sortingItemsHtml);
			}
		}

		return html;
	};

	/************************** END BUILD TOOLBAR **************************/

	FilterScrollToTop.prototype.getTemplate = function() {
		return '<a href="javascript:;" aria-label="Back to top" class="boost-pfs-filter-scroll-to-top js-no-transition {{style}}" style="display: inline;">' +
			'<span>Back to top</span>' +
			'</a>';

	}

	// Add additional feature for product list, used commonly in customizing product list
	ProductList.prototype.afterRender = function(data, eventType) {
		AOS.init({
			easing: 'ease-out-quad',
			once: true,
			offset: 60,
			disableMutationObserver: true
		});
	};

	// Build additional elements
	FilterResult.prototype.afterRender = function(data, eventType) {
		if (!data) data = this.data;
		var totalProduct = '';
		if (data.total_product == 1) {
			totalProduct = boostPFSConfig.label.items_with_count_one.replace(/{{ count }}/g, data.total_product);
		} else {
			totalProduct = boostPFSConfig.label.items_with_count_other.replace(/{{ count }}/g, data.total_product);
		}
		jQ('.boost-pfs-filter-total-product').html(totalProduct);
	};

	function buildBgSet(image) {
		var html = '';
		if (typeof image !== 'undefined' && image.hasOwnProperty('src')) {
			var aspectRatio = image.width / image.height;
			if (image.width <= 180) html += Utils.optimizeImage(image['src'], '180x') + ' 180w ' + Math.round(180 / aspectRatio) + 'h,';
			if (image.width > 180) html += Utils.optimizeImage(image['src'], '180x') + ' 180w ' + Math.round(180 / aspectRatio) + 'h,';
			if (image.width > 360) html += Utils.optimizeImage(image['src'], '360x') + ' 360w ' + Math.round(360 / aspectRatio) + 'h,';
			if (image.width > 540) html += Utils.optimizeImage(image['src'], '540x') + ' 540w ' + Math.round(540 / aspectRatio) + 'h,';
			if (image.width > 720) html += Utils.optimizeImage(image['src'], '720x') + ' 720w ' + Math.round(720 / aspectRatio) + 'h,';
			if (image.width > 900) html += Utils.optimizeImage(image['src'], '900x') + ' 900w ' + Math.round(900 / aspectRatio) + 'h,';
			if (image.width > 1080) html += Utils.optimizeImage(image['src'], '1080x') + ' 1080w ' + Math.round(1080 / aspectRatio) + 'h,';
			if (image.width > 1296) html += Utils.optimizeImage(image['src'], '1296x') + ' 1296w ' + Math.round(1296 / aspectRatio) + 'h,';
			if (image.width > 1512) html += Utils.optimizeImage(image['src'], '1512x') + ' 1512w ' + Math.round(1512 / aspectRatio) + 'h,';
			if (image.width > 1728) html += Utils.optimizeImage(image['src'], '1728x') + ' 1728w ' + Math.round(1728 / aspectRatio) + 'h,';
		}
		return html;
	}
})();
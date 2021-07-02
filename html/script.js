let drag = false
let dropLabel = 'Drop'
let dropName = 'drop'
let totalkg = 0
let righttotalkg = 0
let count = 0
let timer = null
let showhotbar = null
let HSN = []
let rightinvtype = null
let rightinventory = null
let rightinvslot = null
let rightgrade = 0
let maxWeight = 0
let rightmaxWeight = 0
let playerfreeweight = 0
let rightfreeweight = 0
let availableweight = 0
let job = []
let useTooltip = false;
let mouseOnItemBox = false;

let weightFormat = function(num, parenthesis, showZero) {
	if (parenthesis == false) {
		if (num == 0) {
			if (showZero) { return '0' } else {
				return ''
			}
		} else if (num >= 1) {
			return kg.format(num)
		} else { return gram.format(num*1000) }
	} else {
		if (num == 0) {
			if (showZero) { return '0' } else {
				return ''
			}
		} else if (num >= 1) {
			return '('+kg.format(num)+')'
		} else { return '('+gram.format(num*1000)+')' }
	}
}

let kg = Intl.NumberFormat('en-US', {
	style: 'unit',
	unit: 'kilogram', // yeah we're using the superior units of measurement
	unitDisplay: 'narrow',
	minimumFractionDigits: 0,
	maximumFractionDigits: 2
});

let gram = Intl.NumberFormat('en-US', {
	style: 'unit',
	unit: 'gram', // yeah we're using the superior units of measurement
	unitDisplay: 'narrow',
	minimumFractionDigits: 0
});

let money = Intl.NumberFormat('en-US', {
	style: 'currency',
	currency: 'USD',
	minimumFractionDigits: 0
});

let nf = Intl.NumberFormat();

let numberFormat = function(num, item) {
	if (item && item.search('money') != -1) {
		return money.format(num)
	} else {
		return nf.format(num)
	}
}

Display = function(bool) {
	if (bool) {
		$(".inventory-main").fadeIn(200)
	} else {
		$(".iteminfo").fadeOut(200);
		righttotalkg = 0
		rightinvslot = null
		rightinventory = null
		rightinvtype = null
		totalkg = 0
		$('.inventory-main-rightside').removeData()
		$.when($(".inventory-main").fadeOut(200)).done(function() {
			$(".iteminfo").hide();
		});
	}
}

window.addEventListener('message', function(event) {
	if (event.data.message == 'openinventory') {
		$(".item-slot").remove();
		$(".ItemBoxes").remove();
		HSN.SetupInventory(event.data)
	} else if (event.data.message == 'close') {
		HSN.CloseInventory()
	} else if (event.data.message == 'closeright') {
		HSN.SetupInventory()
	} else if (event.data.message == 'refresh') {
		HSN.RefreshInventory(event.data)
		DragAndDrop()
	} else if (event.data.message == 'hotbar') {
		HSN.Hotbar(event.data.items) 
	}else if (event.data.message == "notify") {
		HSN.NotifyItems(event.data.item,event.data.text)
	}
})

HSN.Hotbar = function(items) {
	if (showhotbar == null) {
		showhotbar = true
		let $hotbar = $(".hotbar-container")
		$hotbar.fadeIn(200);
		for(i = 0; i < 5; i++) {
			let $hotslot = $(".hotslot-container.template").clone();
			$hotslot.removeClass('template');
			let item = items[i]
			if (item != null) {
				if (item.metadata == undefined) { item.metadata = {} }
				let image = item.name
				if (item.metadata.image != undefined) { image = item.metadata.image }
				$hotslot.html('<div id="itembox-label">'+item.label+'</div><div class="hotslot-img"><img src="images/'+image+'.png'+'" alt="'+item.name+'" /></div>');
			}
			$hotslot.appendTo($(".hotbar-container"));
		}
		setTimeout(function() {
			$.when($hotbar.fadeOut(300)).done(function() {
				$hotbar.html('')
				showhotbar = null
			});
		}, 3000);
	}
}

HSN.NotifyItems = function(item, text) {
	if (timer !== null) {
		clearTimeout(timer)
	}
	let $itembox = $(".itembox-container.template").clone();
	$itembox.removeClass('template');
	if (item.metadata == undefined) { item.metadata = {} }
	let image = item.name
	if (item.metadata.image != undefined) { image = item.metadata.image }
	$itembox.html('<div id="itembox-action">'+text+'</div><div id="itembox-label">'+item.label+'</div><div class="itembox-img"><img src="images/'+image+'.png'+'" alt="'+item.name+'" /></div>');
	$(".itemboxes-container").prepend($itembox);
	$itembox.fadeIn(250);
	setTimeout(function() {
		$.when($itembox.fadeOut(300)).done(function() {
			$itembox.remove()
		});
	}, 3000);
}

function colorChannelMixer(colorChannelA, colorChannelB, amountToMix){
		let channelA = colorChannelA*amountToMix;
		let channelB = colorChannelB*(1-amountToMix);
		return parseInt(channelA+channelB);
}

function colorMixer(rgbA, rgbB, amountToMix){
		let r = colorChannelMixer(rgbA[0],rgbB[0],amountToMix);
		let g = colorChannelMixer(rgbA[1],rgbB[1],amountToMix);
		let b = colorChannelMixer(rgbA[2],rgbB[2],amountToMix);
		return "rgb("+r+","+g+","+b+")";
}

HSN.InventoryGetDurability = function(quality) {
	if (quality == undefined) {
		quality = 100
	}
	let color = colorMixer([35,190,35], [190,35,35], (quality/100));
	let width = quality
	if (quality <= 0) {width = 100}
	return [color=color, width=width]
}

HSN.RefreshInventory = function(data) {
	totalkg = 0
	$(".item-slot").remove();
	for(i = 1; i <= (data.slots); i++) {
		$(".inventory-main-leftside").find("[inventory-slot=" + i + "]").remove();
		$(".inventory-main-leftside").append('<div class="ItemBoxes" inventory-slot='+i+'></div> ')
	}
	$.each(data.inventory, function (i, item) {
		if (item != null) {
			if (item.metadata == undefined) { item.metadata = {} }
			let image = item.name
			if (item.metadata.image != undefined) { image = item.metadata.image }
			totalkg = totalkg+(item.weight * item.count);
			if ((item.name).split("_")[0] == "WEAPON" && item.metadata.durability !== undefined) {
				$(".inventory-main-leftside").find("[inventory-slot="+item.slot+"]").html('<div class="item-slot-img"><img src="images/'+image+'.png'+'" alt="'+item.name+'" /></div><div class="item-slot-count"><p>'+numberFormat(item.count, item.name)+' '+weightFormat(item.weight/1000 * item.count)+'</p></div><div class="item-slot-label"><div class="item-slot-durability-bar"></div>'+item.label+'</div>');
				$(".inventory-main-leftside").find("[inventory-slot="+item.slot+"]").data("ItemData", item);
				let durability = HSN.InventoryGetDurability(item.metadata.durability)
				$(".inventory-main-leftside").find("[inventory-slot="+item.slot+"]").find(".item-slot-durability-bar").css({"background-color": durability[0],"width": durability[1]});
			} else {
				$(".inventory-main-leftside").find("[inventory-slot="+item.slot+"]").html('<div class="item-slot-img"><img src="images/'+image+'.png'+'" alt="'+item.name+'" /></div><div class="item-slot-count"><p>'+numberFormat(item.count, item.name)+' '+weightFormat(item.weight/1000 * item.count)+'</p></div><div class="item-slot-label">'+item.label+'</div></div>');
				$(".inventory-main-leftside").find("[inventory-slot="+item.slot+"]").data("ItemData", item);
			}
		}
	})
}


HSN.InventoryMessage = function(message, type) {
	$.post("https://linden_inventory/notification", JSON.stringify({
		message: message,
		type: type
	}));
}

HSN.RemoveItemFromSlot = function(inventory,slot) {
	inventory.find("[inventory-slot="+slot+"]").removeData("ItemData");
	inventory.find("[inventory-slot="+slot+"]").find(".item-slot-label").remove();
	inventory.find("[inventory-slot="+slot+"]").find(".item-slot-img").remove();
	inventory.find("[inventory-slot="+slot+"]").find(".item-slot-count").remove();
}


HSN.SetupInventory = function(data) {
	if (data != undefined) {
		maxWeight = data.maxWeight
		job = data.job
		$('.playername').html(data.name)
		for(i = 1; i <= (data.slots); i++) {
			$(".inventory-main-leftside").append('<div class="ItemBoxes" inventory-slot='+i+'></div> ')
			//$(".inventory-main-rightside").data("Owner", data.rightinventory.type);
		}
	}
	Display(true)

	if (data != undefined) {
		// player inventory
		$('.inventory-main-leftside').data("invTier", "Playerinv")
		totalkg = 0
		$.each(data.inventory, function (i, item) {
			if ((item != null)) {
				if (item.metadata == undefined) { item.metadata = {} }
				let image = item.name
				if (item.metadata.image != undefined) { image = item.metadata.image }
				totalkg = totalkg+(item.weight * item.count);
				if ((item.name).split("_")[0] == "WEAPON" && item.metadata.durability !== undefined) {					
					$(".inventory-main-leftside").find("[inventory-slot="+item.slot+"]").html('<div class="item-slot-img"><img src="images/'+image+'.png'+'" alt="'+item.name+'" /></div><div class="item-slot-count"><p>'+numberFormat(item.count, item.name)+' '+weightFormat(item.weight/1000 * item.count)+'</p></div><div class="item-slot-label"><div class="item-slot-durability-bar"></div>'+item.label+'</div>');
					$(".inventory-main-leftside").find("[inventory-slot="+item.slot+"]").data("ItemData", item);
					let durability = HSN.InventoryGetDurability(item.metadata.durability)
					$(".inventory-main-leftside").find("[inventory-slot="+item.slot+"]").find(".item-slot-durability-bar").css({"background-color": durability[0], "width": durability[1]});
				} else {
					$(".inventory-main-leftside").find("[inventory-slot="+item.slot+"]").html('<div class="item-slot-img"><img src="images/'+image+'.png'+'" alt="'+item.name+'" /></div><div class="item-slot-count"><p>'+numberFormat(item.count, item.name)+' '+weightFormat(item.weight/1000 * item.count)+'</p></div><div class="item-slot-label">'+item.label+'</div></div>');
					$(".inventory-main-leftside").find("[inventory-slot="+item.slot+"]").data("ItemData", item);
				}
			}
		})


		$(".progressLeftLabel").html(weightFormat(totalkg/1000, false, true)+'/'+weightFormat(maxWeight/1000, false))
		$( function() {
			$( "#progressbarLeft" ).progressbar({
				value: 100,
				max: 100
			})
			let progressbar = $( "#progressbarLeft" )
			let progressbarValue = progressbar.find( ".ui-progressbar-value" )
			let value = totalkg/maxWeight
			let color = colorMixer([190,35,35], [35,190,35], value)
			progressbarValue.css({"background": color, "width": (value*100) +"%"})
		});
		if (data.rightinventory !== undefined) {
			rightinventory = data.rightinventory.id
			rightinvslot = data.rightinventory.slot
			rightgrade = 0
			if (data.rightinventory.grade) { rightgrade = data.rightinventory.grade }
			$('.inventory-main-rightside').data("invTier", data.rightinventory.type)
			$('.inventory-main-rightside').data("invId", rightinventory)
			rightinvtype = data.rightinventory.type
			rightmaxWeight = data.rightinventory.maxWeight || (data.rightinventory.slots*8000).toFixed(0)
			righttotalkg = 0
			if (rightinvtype == 'player') { $('.rightside-name').html('Player '+data.rightinventory.id) } else { $('.rightside-name').html(data.rightinventory.name) }
			for(i = 1; i <= (data.rightinventory.slots); i++) {
				$(".inventory-main-rightside").append('<div class="ItemBoxes" inventory-slot='+i+'></div> ')
			}
			if (data.rightinventory.type == 'shop') {
				let currency = data.rightinventory.currency
				$.each(data.rightinventory.inventory, function (i, item) {
					if (item != null) {
						if (item.metadata == undefined) { item.metadata = {} }
						let image = item.name
						if (item.metadata.image != undefined) { image = item.metadata.image }
						if ((item.name).split("_")[0] == "WEAPON" && item.metadata.durability !== undefined) {
							if (currency == 'money' || currency == 'black_money' || currency == 'bank' || currency == undefined) {
								$(".inventory-main-rightside").find("[inventory-slot="+item.slot+"]").html('<div class="item-slot-img"><img src="images/'+image+'.png'+'" alt="'+item.name+'" /></div><div class="item-slot-count"><p>'+numberFormat(item.price, 'money')+'</p></div><div class="item-slot-label"><div class="item-slot-durability-bar"></div>'+item.label+'</div>');
							} else {
								$(".inventory-main-rightside").find("[inventory-slot="+item.slot+"]").html('<div class="item-slot-img"><img src="images/'+image+'.png'+'" alt="'+item.name+'" /></div><div class="item-slot-count"><p>'+item.price+' '+currency.label+'</p></div><div class="item-slot-label"><div class="item-slot-durability-bar"></div>'+item.label+'</div>');
							}
							$(".inventory-main-rightside").find("[inventory-slot="+item.slot+"]").data("ItemData", item).data("location", data.rightinventory.id);
							let durability = HSN.InventoryGetDurability(item.metadata.durability)
							$(".inventory-main-rightside").find("[inventory-slot="+item.slot+"]").find(".item-slot-durability-bar").css({"background-color": durability[0],"width":durability[1]});
						} else {
							if (currency == 'money' || currency == 'black_money' || currency == 'bank' || currency == undefined) {
								$(".inventory-main-rightside").find("[inventory-slot="+item.slot+"]").html('<div class="item-slot-img"><img src="images/'+image+'.png'+'" alt="'+item.name+'" /></div><div class="item-slot-count"><p>'+numberFormat(item.price, 'money')+'</p></div><div class="item-slot-label">'+item.label+'</div></div>');
							} else {
								$(".inventory-main-rightside").find("[inventory-slot="+item.slot+"]").html('<div class="item-slot-img"><img src="images/'+image+'.png'+'" alt="'+item.name+'" /></div><div class="item-slot-count"><p>'+item.price+' '+currency.label+'</p></div><div class="item-slot-label">'+item.label+'</div></div>');
							}
							$(".inventory-main-rightside").find("[inventory-slot="+item.slot+"]").data("ItemData", item).data("location", data.rightinventory.id);
						}
					}
				})
			} else {
				$.each(data.rightinventory.inventory, function (i, item) {
					if (item != null) {
						if (item.metadata == undefined) { item.metadata = {} }
						let image = item.name
						if (item.metadata.image != undefined) { image = item.metadata.image }
						if (item.metadata.bag == undefined && item.metadata.weight != undefined) { item.weight = item.weight+item.metadata.weight }
						righttotalkg = righttotalkg+(item.weight * item.count);
						if ((item.name).split("_")[0] == "WEAPON" && item.metadata.durability !== undefined) {
							$(".inventory-main-rightside").find("[inventory-slot="+item.slot+"]").html('<div class="item-slot-img"><img src="images/'+image+'.png'+'" alt="'+item.name+'" /></div><div class="item-slot-count"><p>'+numberFormat(item.count, item.name)+' '+weightFormat(item.weight/1000 * item.count)+'</p></div><div class="item-slot-label"><div class="item-slot-durability-bar"></div>'+item.label+'</div>');
							$(".inventory-main-rightside").find("[inventory-slot="+item.slot+"]").data("ItemData", item);
							let durability = HSN.InventoryGetDurability(item.metadata.durability)
							$(".inventory-main-rightside").find("[inventory-slot="+item.slot+"]").find(".item-slot-durability-bar").css({"background-color": durability[0],"width": durability[1]});
						} else {
							$(".inventory-main-rightside").find("[inventory-slot="+item.slot+"]").html('<div class="item-slot-img"><img src="images/'+image+'.png'+'" alt="'+item.name+'" /></div><div class="item-slot-count"><p>'+numberFormat(item.count, item.name)+' '+weightFormat(item.weight/1000 * item.count)+'</p></div><div class="item-slot-label">'+item.label+'</div></div>');
							$(".inventory-main-rightside").find("[inventory-slot="+item.slot+"]").data("ItemData", item);
						}
					}
				})
			}
		} else {
			$('.rightside-name').html("Drop")
			$(".progressRightLabel").hide();
			$('.inventory-main-rightside').data("invTier", "drop")
			let dropSlots = data.slots
			if (data.rightinventory) {
				rightinventory = data.rightinventory.id
				dropSlots = data.rightinventory.slots
			}
			rightinvtype = 'drop'
			rightmaxWeight = (dropSlots*9000).toFixed(0)
			righttotalkg = 0
			for(i = 1; i <= (dropSlots); i++) {
				$(".inventory-main-rightside").append('<div class="ItemBoxes" inventory-slot='+i+'></div> ')
			}
		}
	} else {
		$('.rightside-name').html("Drop")
		$(".progressRightLabel").hide();
		$('.inventory-main-rightside').data("invTier", "drop")
		rightinvtype = 'drop'
		righttotalkg = 0
	}
	$(".progressRightLabel").show();
				if (righttotalkg > 0 || rightinvtype !== 'drop') {$(".progressRightLabel").html(weightFormat(righttotalkg/1000, false, true)+'/'+weightFormat(rightmaxWeight/1000, false))} else {$(".progressRightLabel").hide();}
				$( function() {
					$( "#progressbarRight" ).progressbar({
						value: 100,
						max: 100
					})
					let progressbar = $( "#progressbarRight" )
					let progressbarValue = progressbar.find( ".ui-progressbar-value" )
					let value = righttotalkg/rightmaxWeight
					let color = colorMixer([190,35,35], [35,190,35], value)
					progressbarValue.css({"background": color, "width": (value*100) +"%"})
				});
	
	DragAndDrop()
}

function DragAndDrop() {
	$("img").on("error", function() {
		$(this).hide();
	});

	$(".ItemBoxes").draggable({
		helper: 'clone',
		appendTo: ".inventory-main",
		revertDuration: 0,
		containment: "parent",
		start: function(event, ui) {
			if ( $(event.target).data("ItemData") != undefined ) {

				$(ui.helper).removeClass("ItemBoxes");
				$(ui.helper).children().not(':first-child').remove()

				fromInv = $(this).parent().data('invTier')
				if (fromInv !== 'Playerinv' && rightgrade > job.grade) {
					HSN.InventoryMessage('stash_lowgrade', 2)
					return false
				} else if (fromInv == 'Playerinv' && rightinvslot == $(this).attr("inventory-slot")) {
					HSN.InventoryMessage('cannot_perform', 2)
					return false
				} else if (fromInv == 'shop') {
					if ($(this).data("location") !== undefined) {
						let Item = $(this).data("ItemData")
						let location = $(this).data("location")
						count = parseInt($("#item-count").val()) || 0
						if (Item != undefined && count >= 0) {
							$.post("https://linden_inventory/BuyFromShop", JSON.stringify({
								data: Item,
								location: location,
								count: count
							}));
						}
					}
					return false
				} else {
					drag = $(event.target).data("ItemData").count;
					$(this).find("img").css("filter", "brightness(50%)");
					count = $("#item-count").val();
				}
			} else {
				return false
			}
		},
		stop: function() {
			setTimeout(function(){
				drag = false;
			}, 300)
			$(this).find("img").css("filter", "brightness(100%)");
		},
	});
	
	$(".ItemBoxes").droppable({ // player inventory slots
		hoverClass: 'ItemBoxes-hoverClass',
		drop: function(event, ui) {
			setTimeout(function(){
				drag = false;
			}, 300)
			curslot = ui.draggable.attr("inventory-slot");
			fromInventory = ui.draggable.parent();
			toInventory = $(this).parent()
			toInv = toInventory.data('invTier')
			toSlot = $(this).attr("inventory-slot");
			fromData = fromInventory.find("[inventory-slot="+curslot+"]").data("ItemData");
			count = parseInt($("#item-count").val()) || 0
			if (fromData !== undefined) {
				if (toInv == 'Playerinv' && rightinvslot !== null && rightinvslot !== undefined && toSlot == rightinvslot) {
					HSN.InventoryMessage('cannot_perform', 2)
					return false
				} else if (count == 0 || count > fromData.count) {
					count = fromData.count
					$("#item-count").val(0)
				}
				SwapItems(fromInventory, toInventory, curslot, toSlot)
			}
		},
	
	});
}

$(".use").droppable({
	hoverClass: 'button-hover',
	drop: function(event, ui) {
		setTimeout(function(){
			drag = false;
		}, 300)
		fromData = ui.draggable.data("ItemData");
		fromInventory = ui.draggable.parent();
		inv = fromInventory.data('invTier')
		$.post("https://linden_inventory/useItem", JSON.stringify({
			item: fromData,
			inv: inv
		}));
		if (fromData.close) {
			HSN.CloseInventory()
		}
	}
});

$(".give").droppable({
	hoverClass: 'button-hover',
	drop: function(event, ui) {
		setTimeout(function(){
			drag = false;
		}, 300)
		fromData = ui.draggable.data("ItemData");
		fromInventory = ui.draggable.parent();
		count = parseInt($("#item-count").val()) || 0
		inv = fromInventory.data('invTier')
		if (fromData !== undefined) {
			if (inv == 'Playerinv' && count >= 0) {
				$.post("https://linden_inventory/giveItem", JSON.stringify({
					item: fromData,
					inv: inv,
					amount: count
				}));
				HSN.CloseInventory()
			}
		}
	}
});

var click_delay = 300,
    clicks = 0,
    click_timer = null;
$(document).on("click", ".ItemBoxes", function(e) {
    clicks++;

    let element = $(this);
    fromInv = element.parent().data('invTier');

    if (clicks === 1) {
        click_timer = setTimeout(function() {
            if (fromInv == 'shop' && element.data("location") !== undefined) {
                e.preventDefault();
                let ItemData = element.data("ItemData")
                let location = element.data("location")
                count = parseInt($("#item-count").val()) || 0
                if (ItemData != undefined && count >= 0) {
                    $.post("https://linden_inventory/BuyFromShop", JSON.stringify({
                        data: ItemData,
                        location: location,
                        count: count
                    }));
                }
            }
            clicks = 0;
        }, click_delay);
    } else {
        clearTimeout(click_timer);
        let fromData = element.data("ItemData");
        if ((fromData !== undefined) && (element.data("location") == undefined)) {
            e.preventDefault();
            $.post("https://linden_inventory/useItem", JSON.stringify({
                item: fromData,
                inv: fromInv
            }));
            if (fromData.close) {
                HSN.CloseInventory()
            }
        }
        clicks = 0;
    }
})

$(document).on("dblclick", ".ItemBoxes", function(e) {
    e.preventDefault();
});

$(".inventory-main").on("mouseenter", ".ItemBoxes", function(e){
	e.preventDefault();
	let Item = $(this).data("ItemData")
	if (e.type == 'mouseenter' && Item != undefined) {
        $(".iteminfo").css({ opacity: 100 });
        mouseOnItemBox = true;

		$(".iteminfo").fadeIn(100);
		$(".iteminfo-label").html('<p>'+Item.label+' <span style="float:right;">'+gram.format(Item.weight)+'</span></p><hr class="line">')
		$(".iteminfo-description").html('')
		if (Item.description) { $(".iteminfo-description").append('<p>'+Item.description+'</p>')}
		if (Item.metadata) {
			if (Item.metadata.type) { $(".iteminfo-description").append('<p>'+Item.metadata.type+'</p>')}
			if (Item.metadata.description) { $(".iteminfo-description").append('<p>'+Item.metadata.description+'</p>')}
			if ((Item.name).split("_")[0] == "WEAPON" && Item.metadata.durability !== undefined) {
				if (Item.metadata.ammo !== undefined) { $(".iteminfo-description").append('<p>Weapon Ammo: '+Item.metadata.ammo+'</p>') }
				if (Item.metadata.durability !== undefined) { $(".iteminfo-description").append('<p>Durability: '+parseInt(Item.metadata.durability).toFixed(0)+''+'%</p>') }
				if (Item.metadata.serial !== undefined) { $(".iteminfo-description").append('<p>Serial Number: '+Item.metadata.serial+'</p>') }
				if (Item.metadata.components) { $(".iteminfo-description").append('<p>Components: '+Item.metadata.components+'</p>')}
				if (Item.metadata.weapontint) { $(".iteminfo-description").append('<p>Tint: '+Item.metadata.weapontint+'</p>')}
			}
		}
	} else {
		$(".iteminfo").fadeOut(100);
	}
});

$(".inventory-main").on("mouseleave", ".ItemBoxes", function(e) {
    $(".iteminfo").css({ opacity: 0 });
    mouseOnItemBox = false;
});

window.onmousemove = function(e) {
    if (useTooltip && mouseOnItemBox) {
        if ((e.clientY + 40 + $(".iteminfo").height()) > window.innerHeight) {
            $(".iteminfo").css({
                top: String(e.clientY - 40 - $(".iteminfo").height()) + "px",
                left: String(e.clientX - ($(".iteminfo").width() / 2)) + "px",
                right: "unset",
                bottom: "unset",
                transform: "unset"
            });
        } else {
            $(".iteminfo").css({
                top: String(e.clientY + 40) + "px",
                left: String(e.clientX - ($(".iteminfo").width() / 2)) + "px",
                right: "unset",
                bottom: "unset",
                transform: "unset"
            });
        }
    }
};

HSN.CloseInventory = function() {
	$.post('https://linden_inventory/exit', JSON.stringify({
		type: rightinvtype,
		invid: rightinventory,
		weight: righttotalkg,
		slot: rightinvslot
	}));
	Display(false)
	return
}


document.onkeyup = function (data) {
	if (data.which == 27) {
		HSN.CloseInventory()
	}
};

$(document).on('click', '.close', function(e){
	HSN.CloseInventory()
});

is_table_equal = function(obj1, obj2) {
	if (obj1 == undefined) { obj1 = {} }
	if (obj2 == undefined) { obj2 = {} }
	const obj1Len = Object.keys(obj1).length;
	const obj2Len = Object.keys(obj2).length;
	if (obj1Len === obj2Len) {
		return Object.keys(obj1).every(key => obj2.hasOwnProperty(key) && obj2[key] === obj1[key]);
	}
	return false
}


SwapItems = function(fromInventory, toInventory, fromSlot, toSlot) {
    let primaryInventory = fromInventory.data('invTier')
    let secondaryInventory = toInventory.data('invTier')

    let primaryInventoryId = fromInventory.data('invId')
    let secondaryInventoryId = toInventory.data('invId')

    let fromItem = fromInventory.find("[inventory-slot=" + fromSlot + "]").data("ItemData");
    let toItem = toInventory.find("[inventory-slot=" + toSlot + "]").data("ItemData");

    fromSlot = Number(fromSlot)
    toSlot = Number(toSlot)

    playerfreeweight = maxWeight - totalkg
    rightfreeweight = rightmaxWeight - righttotalkg
    availableweight = 0

    fromItem.metadata = fromItem.metadata == undefined ? {} : fromItem.metadata;
    let fromimage = fromItem.metadata.image == undefined ? fromItem.name : fromItem.metadata.image;

    if (secondaryInventory !== 'Playerinv') {
        availableweight = rightfreeweight;
    } else {
        availableweight = playerfreeweight;
    }

    if (availableweight !== 0 && (fromItem.weight * count) <= availableweight) {
        if (count <= fromItem.count || (toItem !== undefined && count <= toItem.count)) {
            let postData = {
                type: "swap",
                frominv: primaryInventory,
                toinv: secondaryInventory,
                toSlot: toSlot,
                invid: secondaryInventoryId,
                invid2: primaryInventoryId
            };

            toInventory.find(`[inventory-slot=${toSlot}]`).html(
                `<div class="item-slot-img">
                    <img src="images/${fromimage}.png" alt="${fromItem.name}" />
                </div>
                <div class="item-slot-count">
                    <p>x${numberFormat(fromItem.count, fromItem.name)}</p>
                </div>
                <div class="item-slot-label">
                    <div class="item-slot-durability-bar"></div>
                    <span class="item-label">${fromItem.label}</span>
                </div>`
            );
            toInventory.find(`[inventory-slot=${toSlot}]`).data("ItemData", fromItem);

            let updateFromItem = function(item) {
                let image = item.metadata.image == undefined ? item.name : item.metadata.image;
                fromInventory.find(`[inventory-slot=${fromSlot}]`).html(
                    `<div class="item-slot-img">
                        <img src="images/${image}.png" alt="${item.name}" />
                    </div>
                    <div class="item-slot-count">
                        <p>x${numberFormat(item.count, item.name)}</p>
                    </div>
                    <div class="item-slot-label">
                        <div class="item-slot-durability-bar"></div>
                        <span class="item-label">${item.label}</span>
                    </div>`
                );
                fromInventory.find(`[inventory-slot=${fromSlot}]`).data("ItemData", item);
            }
            
            if (toItem !== undefined) {
                toItem.metadata = toItem.metadata == undefined ? {} : toItem.metadata;
                toimage = toItem.metadata.image == undefined ? toItem.name : toItem.metadata.image;

                updateFromItem(toItem);

                if (fromItem.name.split("_")[0] == "WEAPON" && fromItem.metadata.durability !== undefined) {
                    let durability = HSN.InventoryGetDurability(fromItem.metadata.durability);
                    toInventory.find("[inventory-slot=" + toSlot + "]").find(".item-slot-durability-bar").css({
                        "display": "block",
                        "background-color": durability[0],
                        "width": durability[1] + '%'
                    });
                }

                if (toItem.name.split("_")[0] == "WEAPON" && toItem.metadata.durability !== undefined) {
                    let durability = HSN.InventoryGetDurability(toItem.metadata.durability);
                    fromInventory.find("[inventory-slot=" + fromSlot + "]").find(".item-slot-durability-bar").css({
                        "display": "block",
                        "background-color": durability[0],
                        "width": durability[1] + '%'
                    });
                }

                if (fromItem.name == toItem.name) {
                    if (toItem.stack && is_table_equal(toItem.metadata, fromItem.metadata)) {
                        toItem.count = toItem.count + count;
                        toInventory.find(`[inventory-slot=${toSlot}]`).find(".item-slot-count").html(`<p>x${numberFormat(toItem.count, toItem.name)}</p>`);
                        toInventory.find(`[inventory-slot=${toSlot}]`).data("ItemData", toItem);

                        if (count < fromItem.count) {
                            fromItem.count = fromItem.count - count;
                            fromInventory.find(`[inventory-slot=${fromSlot}]`).find(".item-slot-count").html(`<p>x${numberFormat(fromItem.count, fromItem.name)}</p>`);
                            toInventory.find(`[inventory-slot=${fromSlot}]`).data("ItemData", fromItem);
                        } else {
                            postData.type = "freeslot";
                            postData.item = toItem;
                        }
                    }
                }

                postData.fromSlot = fromSlot;
                postData.fromItem = toItem;
                postData.toItem = fromItem;
            } else {
                if (count == fromItem.count) {
                    toInventory.find(`[inventory-slot=${toSlot}]`).find(".item-slot-count").html(`<p>x${numberFormat(count, fromItem.name)}</p>`);
                    toInventory.find(`[inventory-slot=${toSlot}]`).data("ItemData", fromItem);
                    postData.type = "freeslot";
                    postData.item = fromItem;
                } else {
                    let oldItem = JSON.parse(JSON.stringify(fromItem));
                    oldItem.count = fromItem.count - count;
                    oldItem.slot = fromSlot;
                    updateFromItem(oldItem);

                    let newItem = JSON.parse(JSON.stringify(fromItem));
                    newItem.count = count;
                    newItem.slot = toSlot;
                    toInventory.find(`[inventory-slot=${toSlot}]`).find(".item-slot-count").html(`<p>x${numberFormat(newItem.count, newItem.name)}</p>`);
                    toInventory.find(`[inventory-slot=${toSlot}]`).data("ItemData", newItem);

                    postData.type = "split";
                    postData.fromSlot = fromSlot;
                    postData.oldslotItem = oldItem;
                    postData.newslotItem = newItem;
                }
            }

            if (postData.type == "freeslot") {
                postData.emptyslot = fromSlot;
                ["fromSlot", "fromItem", "toItem"].forEach(key => { delete postData[key]; });
                HSN.RemoveItemFromSlot(fromInventory, fromSlot);
            }

            $.post("https://linden_inventory/saveinventorydata", JSON.stringify(postData));

            if (secondaryInventory !== primaryInventory) {
                righttotalkg = righttotalkg + ((secondaryInventory !== 'Playerinv' ? -1 : 1) * fromItem.weight * count);

                if (rightinvtype == 'drop' && righttotalkg == 0) {
                    $(".progressRightLabel").hide();
                } else {
                    $(".progressRightLabel").show();
                }

                $(".progressRightLabel").html(weightFormat(righttotalkg / 1000, false, true) + '/' + weightFormat(rightmaxWeight / 1000, false));
                $(function() {
                    $("#progressbarRight").progressbar();
                    let progressbar = $("#progressbarRight");
                    let progressbarValue = progressbar.find(".ui-progressbar-value");
                    let value = righttotalkg / rightmaxWeight;
                    let color = colorMixer([190, 35, 35], [35, 190, 35], value);
                    progressbarValue.css({ "background": color, "width": (value * 100) + "%" });
                });
                
                if (rightinvtype == 'bag') {
                    item = fromInventory.find("[inventory-slot=" + rightinvslot + "]").data("ItemData");
                    item.weight = item.weight + ((secondaryInventory !== 'Playerinv' ? -1 : 1) * fromItem.weight * count);

                    let image = item.metadata.image != undefined ? item.metadata.image : item.name;
                    $(".inventory-main-leftside").find("[inventory-slot=" + item.slot + "]").html(
                        `<div class="item-slot-img">
                            <img src="images/${image}.png" alt="${item.name}" />
                        </div>
                        <div class="item-slot-count">
                            <p>x${numberFormat(item.count, item.name)}</p>
                        </div>
                        <div class="item-slot-label">
                            <span class="item-label">${item.label}</span>
                        </div>`
                    );
                } else {
                    totalkg = totalkg - ((secondaryInventory !== 'Playerinv' ? -1 : 1) * fromItem.weight * count);

                    $(".progressLeftLabel").html(weightFormat(totalkg / 1000, false, true) + '/' + weightFormat(maxWeight / 1000, false));
                    $(function() {
                        $("#progressbarLeft").progressbar()
                        let progressbar = $("#progressbarLeft")
                        let progressbarValue = progressbar.find(".ui-progressbar-value")
                        let value = totalkg / maxWeight
                        let color = colorMixer([190, 35, 35], [35, 190, 35], value)
                        progressbarValue.css({ "background": color, "width": (value * 100) + "%" })
                    });
                }
            }
        } else {
            HSN.InventoryMessage('cannot_perform', 2)
        }
    } else {
        HSN.InventoryMessage(secondaryInventory == 'Playerinv' ? 'cannot_carry' : 'cannot_carry_other', 2);
    }
    DragAndDrop()
}

var canScroll = true

function Scroll(event) {
	event.preventDefault()
	if (canScroll) {
		canScroll = false
		if (event.originalEvent.deltaY > 0) { scroll = 102 } else { scroll = -102 }
		$.when(this.scrollBy({
			top: scroll
		})).done(function() {
			canScroll = true
		})
	}
}

$("#left-inv").on("wheel", Scroll)
$("#right-inv").on("wheel", Scroll)

function Counter(event) {
	let count = parseInt($("#item-count").val()) || 0
	if (event.originalEvent.deltaY < 0) {
		if (count >= drag) { return }
		$("#item-count").val(count+1)
	}
	else if (count > 0) {
		$("#item-count").val(count - 1) 
	}
}

$("#item-count").on("wheel", function(event) {
	let count = parseInt($("#item-count").val()) || 0
	if (event.originalEvent.deltaY < 0) {
		if (drag && count >= drag) { return }
		$("#item-count").val(count+1)
	}
	else if (count > 0) {
		$("#item-count").val(count - 1) 
	}
})
